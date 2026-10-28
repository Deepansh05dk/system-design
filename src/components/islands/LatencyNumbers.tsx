import { useState } from 'react';
import Widget from './Widget';

const ITEMS: { name: string; ns: number; group: string }[] = [
  { name: 'Read from CPU L1 cache', ns: 1, group: 'cpu' },
  { name: 'Read from main memory (RAM)', ns: 100, group: 'memory' },
  { name: 'Compress 1 KB (fast algorithm)', ns: 2_000, group: 'cpu' },
  { name: 'Read 1 MB sequentially from RAM', ns: 10_000, group: 'memory' },
  { name: 'Random read from SSD', ns: 16_000, group: 'disk' },
  { name: 'Read 1 MB sequentially from SSD', ns: 50_000, group: 'disk' },
  { name: 'Round trip inside one data center', ns: 500_000, group: 'network' },
  { name: 'Read 1 MB sequentially from HDD', ns: 1_000_000, group: 'disk' },
  { name: 'HDD disk seek', ns: 2_000_000, group: 'disk' },
  { name: 'Round trip US East ↔ US West', ns: 70_000_000, group: 'network' },
  { name: 'Round trip Europe ↔ US', ns: 150_000_000, group: 'network' },
  { name: 'Round trip India ↔ US East', ns: 200_000_000, group: 'network' },
];

const COLORS: Record<string, string> = {
  cpu: 'var(--k-lb)',
  memory: 'var(--k-cache)',
  disk: 'var(--k-db)',
  network: 'var(--k-client)',
};

function fmt(ns: number) {
  if (ns < 1_000) return `${ns} ns`;
  if (ns < 1_000_000) return `${+(ns / 1_000).toFixed(1)} µs`;
  if (ns < 1_000_000_000) return `${+(ns / 1_000_000).toFixed(1)} ms`;
  return `${+(ns / 1_000_000_000).toFixed(1)} s`;
}

function human(ns: number) {
  // pretend 1 ns = 1 second
  const s = ns;
  if (s < 60) return `${s} seconds`;
  if (s < 3600) return `${+(s / 60).toFixed(1)} minutes`;
  if (s < 86400) return `${+(s / 3600).toFixed(1)} hours`;
  if (s < 86400 * 365) return `${+(s / 86400).toFixed(1)} days`;
  return `${+(s / (86400 * 365)).toFixed(1)} years`;
}

export default function LatencyNumbers() {
  const [humanScale, setHuman] = useState(false);
  const max = Math.log10(ITEMS[ITEMS.length - 1].ns);
  return (
    <Widget title="Latency numbers every engineer should know" tag="Visual">
      <div className="widget-controls">
        <div className="seg">
          <button className={!humanScale ? 'on' : ''} onClick={() => setHuman(false)}>
            Real time
          </button>
          <button className={humanScale ? 'on' : ''} onClick={() => setHuman(true)}>
            Human scale (1 ns = 1 second)
          </button>
        </div>
        <span className="small muted">Bars use a log scale: each grid step is 10× slower.</span>
      </div>
      <div className="lat-list">
        {ITEMS.map((it) => (
          <div className="lat-row" key={it.name}>
            <div className="lat-name">{it.name}</div>
            <div className="lat-bar-wrap">
              <div
                className="lat-bar"
                style={{ width: `${Math.max(2, ((Math.log10(it.ns) + 0.3) / (max + 0.3)) * 100)}%`, background: COLORS[it.group] }}
              />
            </div>
            <div className="lat-val">{humanScale ? human(it.ns) : fmt(it.ns)}</div>
          </div>
        ))}
      </div>
      <div className="lat-legend small">
        {Object.entries(COLORS).map(([k, c]) => (
          <span key={k}>
            <i style={{ background: c }} /> {k}
          </span>
        ))}
      </div>
      <div className="result-banner info">
        Takeaway: memory is ~100× faster than SSD, a data-center round trip is ~5,000× slower than memory, and crossing
        the planet costs ~100–200 ms. <b>That is why we cache in memory and put servers close to users.</b>
      </div>
    </Widget>
  );
}
