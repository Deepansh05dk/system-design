import { useMemo, useState, type MouseEvent } from 'react';
import Widget from './Widget';

const W = 320;
const H = 320;
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function rand(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// restaurants: clustered downtown + scattered
const PLACES = Array.from({ length: 70 }, (_, i) => {
  const clustered = i < 40;
  const x = clustered ? 90 + rand(i) * 90 : rand(i) * W;
  const y = clustered ? 80 + rand(i + 100) * 90 : rand(i + 100) * H;
  return { id: i, x, y };
});

interface QNode {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
}

function quadtree(cap: number) {
  const out: QNode[] = [];
  const rec = (x: number, y: number, w: number, h: number, depth: number) => {
    const inside = PLACES.filter((p) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h);
    out.push({ x, y, w, h, depth });
    if (inside.length > cap && depth < 6) {
      const hw = w / 2;
      const hh = h / 2;
      rec(x, y, hw, hh, depth + 1);
      rec(x + hw, y, hw, hh, depth + 1);
      rec(x, y + hh, hw, hh, depth + 1);
      rec(x + hw, y + hh, hw, hh, depth + 1);
    }
  };
  rec(0, 0, W, H, 0);
  return out;
}

export default function GeoGrid() {
  const [mode, setMode] = useState<'geohash' | 'quadtree'>('geohash');
  const [level, setLevel] = useState(2); // grid split level: 2^level cells per side
  const [cap, setCap] = useState(6);
  const [me, setMe] = useState({ x: 140, y: 130 });

  const n = 2 ** level;
  const cw = W / n;
  const ch = H / n;
  const myCol = Math.min(n - 1, Math.floor(me.x / cw));
  const myRow = Math.min(n - 1, Math.floor(me.y / ch));
  const inNeighborhood = (p: { x: number; y: number }) => {
    const c = Math.floor(p.x / cw);
    const r = Math.floor(p.y / ch);
    return Math.abs(c - myCol) <= 1 && Math.abs(r - myRow) <= 1;
  };
  const found = PLACES.filter(inNeighborhood);

  // a fake-but-consistent geohash-like label: interleave column/row bits and map to base32
  const label = (col: number, row: number) => {
    let bits = '';
    for (let i = level - 1; i >= 0; i--) bits += ((col >> i) & 1).toString() + ((n - 1 - row) >> i & 1).toString();
    const chunks = bits.match(/.{1,5}/g) ?? [];
    return chunks.map((c) => BASE32[parseInt(c.padEnd(5, '0'), 2)]).join('');
  };

  const qt = useMemo(() => quadtree(cap), [cap]);
  const leaves = qt.filter((q) => !qt.some((o) => o.depth === q.depth + 1 && o.x >= q.x && o.x < q.x + q.w && o.y >= q.y && o.y < q.y + q.h));
  const myLeaf = leaves.find((q) => me.x >= q.x && me.x < q.x + q.w && me.y >= q.y && me.y < q.y + q.h);

  const click = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMe({ x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H });
  };

  return (
    <Widget title="Find restaurants near me" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'geohash' ? 'on' : ''} onClick={() => setMode('geohash')}>
            Geohash grid
          </button>
          <button className={mode === 'quadtree' ? 'on' : ''} onClick={() => setMode('quadtree')}>
            Quadtree
          </button>
        </div>
        {mode === 'geohash' ? (
          <label>
            Precision (grid {n}×{n})
            <input type="range" min={1} max={5} value={level} onChange={(e) => setLevel(+e.target.value)} />
          </label>
        ) : (
          <label>
            Max places per cell: <b>{cap}</b>
            <input type="range" min={2} max={20} value={cap} onChange={(e) => setCap(+e.target.value)} />
          </label>
        )}
        <span className="small muted">Click the map to move 📍</span>
      </div>
      <div className="geo-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="geo-svg" onClick={click}>
          <rect width={W} height={H} fill="var(--surface-2)" />
          {mode === 'geohash' &&
            Array.from({ length: n * n }).map((_, i) => {
              const c = i % n;
              const r = Math.floor(i / n);
              const mine = c === myCol && r === myRow;
              const near = Math.abs(c - myCol) <= 1 && Math.abs(r - myRow) <= 1;
              return (
                <g key={i}>
                  <rect x={c * cw} y={r * ch} width={cw} height={ch} fill={mine ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : near ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'none'} stroke="var(--border-strong)" strokeWidth="0.7" />
                  {n <= 8 && (
                    <text x={c * cw + 3} y={r * ch + 11} fontSize="8.5" fill="var(--text-faint)" fontFamily="var(--mono)">
                      {label(c, r)}
                    </text>
                  )}
                </g>
              );
            })}
          {mode === 'quadtree' &&
            leaves.map((q, i) => (
              <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill={q === myLeaf ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'none'} stroke="var(--border-strong)" strokeWidth="0.8" />
            ))}
          {PLACES.map((p) => {
            const hit = mode === 'geohash' ? inNeighborhood(p) : myLeaf && p.x >= myLeaf.x && p.x < myLeaf.x + myLeaf.w && p.y >= myLeaf.y && p.y < myLeaf.y + myLeaf.h;
            return <circle key={p.id} cx={p.x} cy={p.y} r="3.2" fill={hit ? 'var(--good)' : 'var(--text-faint)'} />;
          })}
          <text x={me.x} y={me.y} fontSize="18" textAnchor="middle" dominantBaseline="auto">
            📍
          </text>
        </svg>
        <div className="geo-side small">
          {mode === 'geohash' ? (
            <>
              <p style={{ marginTop: 0 }}>
                Your cell: <code>{label(myCol, myRow)}</code>. We search <b>your cell + its 8 neighbours</b> (a place just across the border is close too).
              </p>
              <p>
                Restaurants checked: <b>{found.length}</b> of {PLACES.length}.
              </p>
              <p className="muted">
                Points that are close usually share a geohash <b>prefix</b>, so “find nearby” becomes fast prefix lookups on an indexed
                <code>geohash</code> column. Each extra character makes cells ~32× smaller.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                Cells split into 4 whenever they hold more than <b>{cap}</b> places. Dense downtown → tiny cells; empty areas → big cells.
              </p>
              <p>
                Leaf cells: <b>{leaves.length}</b>. Your cell holds <b>{myLeaf ? PLACES.filter((p) => p.x >= myLeaf.x && p.x < myLeaf.x + myLeaf.w && p.y >= myLeaf.y && p.y < myLeaf.y + myLeaf.h).length : 0}</b> places.
              </p>
              <p className="muted">The tree adapts to density, which geohash’s fixed grid can’t do. It usually lives in memory on location servers.</p>
            </>
          )}
        </div>
      </div>
    </Widget>
  );
}
