import { useEffect, useMemo, useState } from 'react';

export interface FlowNode {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  kind?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  bidir?: boolean;
  curve?: number;
  manual?: boolean;
}

export interface FlowStep {
  title: string;
  text?: string;
  add?: string[];
  remove?: string[];
  flow?: string[];
  highlight?: string[];
}

const KIND_ICON: Record<string, string> = {
  client: '💻',
  user: '👤',
  mobile: '📱',
  server: '🖥️',
  db: '🗄️',
  cache: '⚡',
  queue: '📬',
  lb: '⚖️',
  cdn: '🌍',
  storage: '🪣',
  service: '⚙️',
  external: '☁️',
  worker: '👷',
  dns: '📖',
  search: '🔎',
  gateway: '🚪',
};

const edgeKey = (e: FlowEdge) => `${e.from}>${e.to}`;

function clipToBox(cx: number, cy: number, tx: number, ty: number, w: number, h: number) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = Math.abs(dx) / (w / 2 + 6);
  const sy = Math.abs(dy) / (h / 2 + 6);
  const s = Math.max(sx, sy);
  return { x: cx + dx / s, y: cy + dy / s };
}

function edgeGeometry(a: FlowNode, b: FlowNode, curve = 0) {
  const aw = a.w ?? 144;
  const ah = a.h ?? 58;
  const bw = b.w ?? 144;
  const bh = b.h ?? 58;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const cx = mx + nx * curve;
  const cy = my + ny * curve;
  const p1 = clipToBox(a.x, a.y, curve ? cx : b.x, curve ? cy : b.y, aw, ah);
  const p2 = clipToBox(b.x, b.y, curve ? cx : a.x, curve ? cy : a.y, bw, bh);
  const d = curve ? `M${p1.x},${p1.y} Q${cx},${cy} ${p2.x},${p2.y}` : `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
  const rd = curve ? `M${p2.x},${p2.y} Q${cx},${cy} ${p1.x},${p1.y}` : `M${p2.x},${p2.y} L${p1.x},${p1.y}`;
  const lx = curve ? (p1.x + 2 * cx + p2.x) / 4 : (p1.x + p2.x) / 2;
  const ly = curve ? (p1.y + 2 * cy + p2.y) / 4 : (p1.y + p2.y) / 2;
  return { d, rd, lx, ly };
}

export default function ArchFlow({
  title = 'Architecture walkthrough',
  nodes,
  edges,
  steps,
  width = 900,
  height = 420,
}: {
  title?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  steps?: FlowStep[];
  width?: number;
  height?: number;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const total = steps?.length ?? 0;

  useEffect(() => {
    if (!playing) return;
    if (i >= total - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((v) => v + 1), 3200);
    return () => clearTimeout(t);
  }, [playing, i, total]);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const { visible, fresh } = useMemo(() => {
    if (!steps || steps.length === 0) {
      return { visible: new Set([...nodes.map((n) => n.id), ...edges.map(edgeKey)]), fresh: new Set<string>() };
    }
    const vis = new Set<string>();
    let latest = new Set<string>();
    for (let s = 0; s <= i; s++) {
      const st = steps[s];
      latest = new Set();
      st.add?.forEach((k) => {
        if (!vis.has(k)) latest.add(k);
        vis.add(k);
      });
      st.remove?.forEach((k) => vis.delete(k));
    }
    return { visible: vis, fresh: latest };
  }, [steps, i, nodes, edges]);

  const step = steps?.[i];
  const flows = new Set(step?.flow ?? []);
  const highlights = new Set(step?.highlight ?? []);

  const edgeVisible = (e: FlowEdge) => {
    const k = edgeKey(e);
    if (visible.has(`-${k}`)) return false;
    if (e.manual) return visible.has(k);
    return visible.has(e.from) && visible.has(e.to);
  };

  return (
    <div className="widget archflow">
      <div className="widget-head">
        <span className="tag">{steps ? 'Step-by-step' : 'Diagram'}</span>
        <span>{title}</span>
      </div>
      <div className="af-canvas">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <defs>
            <marker id="af-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-faint)" />
            </marker>
            <marker id="af-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <pattern id="af-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#af-grid)" />
          {edges.filter(edgeVisible).map((e) => {
            const a = nodeById[e.from];
            const b = nodeById[e.to];
            if (!a || !b) return null;
            const k = edgeKey(e);
            const { d, rd, lx, ly } = edgeGeometry(a, b, e.curve);
            const fwd = flows.has(k);
            const back = flows.has(`${e.to}>${e.from}`);
            const hot = fwd || back;
            return (
              <g key={k} className={`af-edge ${hot ? 'hot' : ''} ${fresh.has(k) ? 'fresh' : ''}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={hot ? 'var(--accent)' : 'var(--border-strong)'}
                  strokeWidth={hot ? 2.4 : 1.6}
                  strokeDasharray={e.dashed ? '6 5' : undefined}
                  markerEnd={`url(#${hot ? 'af-arrow-hot' : 'af-arrow'})`}
                  markerStart={e.bidir ? `url(#${hot ? 'af-arrow-hot' : 'af-arrow'})` : undefined}
                />
                {e.label && (
                  <text x={lx} y={ly - 6} textAnchor="middle" className="af-elabel">
                    {e.label}
                  </text>
                )}
                {[fwd ? d : null, back ? rd : null].filter(Boolean).map((path, pi) =>
                  [0, 0.45].map((delay) => (
                    <circle key={`${i}-${pi}-${delay}`} r="5" fill="var(--accent)" className="af-packet">
                      <animateMotion dur="1.4s" begin={`${delay}s`} repeatCount="indefinite" path={path!} />
                    </circle>
                  )),
                )}
              </g>
            );
          })}
          {nodes
            .filter((n) => visible.has(n.id))
            .map((n) => {
              const w = n.w ?? 144;
              const h = n.h ?? 58;
              const color = `var(--k-${n.kind ?? 'server'})`;
              const icon = n.icon ?? KIND_ICON[n.kind ?? 'server'] ?? '⬢';
              const isHi = highlights.has(n.id);
              const x = n.x - w / 2;
              const y = n.y - h / 2;
              return (
                <g
                  key={n.id}
                  className={`af-node ${fresh.has(n.id) ? 'fresh' : ''} ${isHi ? 'hi' : ''}`}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                >
                  {isHi && (
                    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx="16" fill="none" stroke={color} strokeWidth="2" className="af-glow" />
                  )}
                  {n.kind === 'db' ? (
                    <>
                      <path
                        d={`M${x},${y + 8} L${x},${y + h - 8} A${w / 2},8 0 0 0 ${x + w},${y + h - 8} L${x + w},${y + 8}`}
                        fill="var(--surface)"
                        stroke={color}
                        strokeWidth="1.8"
                      />
                      <ellipse cx={n.x} cy={y + 8} rx={w / 2} ry="8" fill={`color-mix(in srgb, ${color} 18%, var(--surface))`} stroke={color} strokeWidth="1.8" />
                    </>
                  ) : (
                    <rect x={x} y={y} width={w} height={h} rx="11" fill="var(--surface)" stroke={color} strokeWidth="1.8" />
                  )}
                  <text x={x + 11} y={n.y + 7} fontSize="19">
                    {icon}
                  </text>
                  <text x={x + 39} y={n.sub ? n.y - 2 : n.y + 5} className="af-label">
                    {n.label}
                  </text>
                  {n.sub && (
                    <text x={x + 39} y={n.y + 14} className="af-sub">
                      {n.sub}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>
      {steps && step && (
        <div className="af-caption">
          <div className="af-step-head">
            <span className="af-step-num">
              Step {i + 1}/{total}
            </span>
            <span className="af-step-title">{step.title}</span>
          </div>
          {step.text && <div className="af-step-text" dangerouslySetInnerHTML={{ __html: step.text }} />}
          <div className="af-controls">
            <button className="btn btn-sm" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
              ◀ Prev
            </button>
            <div className="af-dots">
              {steps.map((s, si) => (
                <button key={si} className={`af-dot ${si === i ? 'on' : ''} ${si < i ? 'past' : ''}`} onClick={() => setI(si)} title={s.title} aria-label={`Go to step ${si + 1}: ${s.title}`} />
              ))}
            </div>
            <button className="btn btn-sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? '⏸ Pause' : '▶ Auto'}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setI(Math.min(total - 1, i + 1))} disabled={i === total - 1}>
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
