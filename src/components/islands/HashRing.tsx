import { useMemo, useState } from 'react';
import Widget from './Widget';

const ALL_NODES = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLORS: Record<string, string> = { A: '#6366f1', B: '#f59e0b', C: '#10b981', D: '#ec4899', E: '#0ea5e9', F: '#8b5cf6' };
const KEYS = Array.from({ length: 28 }, (_, i) => `key${i + 1}`);
const RING = 3600;

// cyrb53-style hash with a fixed seed chosen so the default 3-server ring looks reasonable
function h(str: string, seed = 10) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) % RING;
}

function build(nodes: string[], vnodes: number) {
  const points = nodes.flatMap((n) => Array.from({ length: vnodes }, (_, i) => ({ node: n, pos: h(`${n}-v${i}`) }))).sort((a, b) => a.pos - b.pos);
  const owner = (k: string) => {
    const p = h(k);
    const pt = points.find((x) => x.pos >= p) ?? points[0];
    return pt.node;
  };
  return { points, owner };
}

export default function HashRing() {
  const [nodes, setNodes] = useState(['A', 'B', 'C']);
  const [vnodes, setVnodes] = useState(1);
  const [prev, setPrev] = useState<string[] | null>(null);

  const ring = useMemo(() => build(nodes, vnodes), [nodes, vnodes]);
  const prevRing = useMemo(() => (prev ? build(prev, vnodes) : null), [prev, vnodes]);

  const assign = KEYS.map((k) => ({ k, pos: h(k), node: ring.owner(k), moved: prevRing ? prevRing.owner(k) !== ring.owner(k) : false }));
  const moved = assign.filter((a) => a.moved).length;
  const modMoved = prev ? KEYS.filter((k) => h(k) % prev.length !== h(k) % nodes.length).length : 0;
  const counts = Object.fromEntries(nodes.map((n) => [n, assign.filter((a) => a.node === n).length]));

  const add = () => {
    const next = ALL_NODES.find((n) => !nodes.includes(n));
    if (!next) return;
    setPrev(nodes);
    setNodes([...nodes, next]);
  };
  const remove = (n: string) => {
    if (nodes.length <= 2) return;
    setPrev(nodes);
    setNodes(nodes.filter((x) => x !== n));
  };

  const R = 140;
  const C = 170;
  const xy = (pos: number, r = R) => {
    const a = (pos / RING) * Math.PI * 2 - Math.PI / 2;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  };

  return (
    <Widget title="Consistent hashing ring" tag="Simulator">
      <div className="widget-controls">
        <button className="btn btn-primary" onClick={add} disabled={nodes.length >= ALL_NODES.length}>
          + Add server
        </button>
        <span className="small muted">Click a server in the legend to remove it.</span>
        <label>
          Virtual nodes per server
          <select value={vnodes} onChange={(e) => { setVnodes(+e.target.value); setPrev(null); }}>
            {[1, 3, 8, 20].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="ring-wrap">
        <svg viewBox="0 0 340 340" className="ring-svg">
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border-strong)" strokeWidth="2" />
          {assign.map((a) => {
            const p = xy(a.pos, R - 22);
            const q = xy(a.pos, R);
            return (
              <g key={a.k}>
                <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={COLORS[a.node]} strokeWidth="1" opacity="0.5" />
                <circle cx={p.x} cy={p.y} r={a.moved ? 7 : 5} fill={COLORS[a.node]} stroke={a.moved ? 'var(--text)' : 'none'} strokeWidth="2">
                  <title>{`${a.k} → server ${a.node}`}</title>
                </circle>
              </g>
            );
          })}
          {ring.points.map((pt, i) => {
            const p = xy(pt.pos);
            return (
              <g key={i}>
                <rect x={p.x - 11} y={p.y - 11} width="22" height="22" rx="6" fill={COLORS[pt.node]} />
                <text x={p.x} y={p.y + 4.5} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">
                  {pt.node}
                </text>
              </g>
            );
          })}
          <text x={C} y={C - 4} textAnchor="middle" className="af-label">
            hash space
          </text>
          <text x={C} y={C + 14} textAnchor="middle" className="af-sub">
            0 → 2³² (wraps around)
          </text>
        </svg>
        <div className="ring-side">
          <div className="box-title">Servers (keys owned)</div>
          {nodes.map((n) => (
            <button key={n} className="ring-legend" onClick={() => remove(n)} title="Remove server">
              <i style={{ background: COLORS[n] }} /> Server {n}: <b>{counts[n]}</b> keys <span className="muted">✕</span>
            </button>
          ))}
          <p className="small muted">
            Each key (dot) belongs to the first server found going <b>clockwise</b> from it. Squares are servers. Dots with
            a dark outline just moved.
          </p>
          {prev && (
            <div className="result-banner good">
              {prev.length} → {nodes.length} servers: <b>{moved}</b>/{KEYS.length} keys moved with consistent hashing.
              <br />
              With <code>hash % N</code>, <b>{modMoved}</b>/{KEYS.length} would have moved.
            </div>
          )}
          {vnodes === 1 && <div className="small muted">Notice the uneven split? Try 8 or 20 virtual nodes.</div>}
        </div>
      </div>
    </Widget>
  );
}
