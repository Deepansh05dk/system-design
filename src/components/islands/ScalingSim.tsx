import { useState } from 'react';
import Widget from './Widget';

const SIZES = [
  { name: 'Small', cpu: 2, cap: 1000, cost: 50 },
  { name: 'Medium', cpu: 8, cap: 4000, cost: 220 },
  { name: 'Large', cpu: 32, cap: 14000, cost: 1000 },
  { name: 'X-Large', cpu: 96, cap: 36000, cost: 3600 },
  { name: 'Biggest available', cpu: 192, cap: 60000, cost: 9000 },
];

function Load({ used, cap, label, dead }: { used: number; cap: number; label: string; dead?: boolean }) {
  const pct = dead ? 0 : Math.min(100, (used / cap) * 100);
  const color = dead ? 'var(--border-strong)' : pct >= 100 ? 'var(--bad)' : pct > 75 ? 'var(--warn)' : 'var(--good)';
  return (
    <div className="sc-server">
      <div className="sc-label">
        {dead ? '💀' : '🖥️'} {label}
      </div>
      <div className="meter">
        <div style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="small muted">{dead ? 'down' : `${Math.round(pct)}% busy`}</div>
    </div>
  );
}

export default function ScalingSim() {
  const [traffic, setTraffic] = useState(3000);
  const [size, setSize] = useState(1);
  const [count, setCount] = useState(3);
  const [vDead, setVDead] = useState(false);
  const [hDead, setHDead] = useState(false);

  const v = SIZES[size];
  const vServed = vDead ? 0 : Math.min(traffic, v.cap);
  const alive = count - (hDead ? 1 : 0);
  const hCap = alive * SIZES[0].cap;
  const hServed = Math.min(traffic, hCap);
  const perServer = alive ? traffic / alive : 0;

  return (
    <Widget title="Scale up vs scale out" tag="Simulator">
      <div className="widget-controls">
        <label>
          Incoming traffic: <b>{traffic.toLocaleString()} req/s</b>
          <input type="range" min={500} max={80000} step={500} value={traffic} onChange={(e) => setTraffic(+e.target.value)} style={{ width: 220 }} />
        </label>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">⬆️ Vertical: one bigger machine</div>
          <div className="seg" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
            {SIZES.map((s, i) => (
              <button key={s.name} className={i === size ? 'on' : ''} onClick={() => setSize(i)}>
                {s.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <Load used={traffic} cap={v.cap} label={`${v.name} · ${v.cpu} vCPU`} dead={vDead} />
          <div className="stat-row">
            <div className="stat">
              <div className="v">{vServed.toLocaleString()}</div>
              <div className="l">served req/s</div>
            </div>
            <div className="stat">
              <div className="v">${v.cost.toLocaleString()}</div>
              <div className="l">per month</div>
            </div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={() => setVDead(!vDead)}>
            {vDead ? '↺ Restore' : '💥 Crash the machine'}
          </button>
          {vDead && <div className="result-banner bad">Single point of failure: everything is down.</div>}
          {!vDead && traffic > SIZES[4].cap && size === 4 && <div className="result-banner bad">Hit the ceiling: no bigger machine exists.</div>}
        </div>
        <div className="box">
          <div className="box-title">➡️ Horizontal: many small machines</div>
          <div className="widget-controls" style={{ marginBottom: 8 }}>
            <button className="btn btn-sm" onClick={() => setCount(Math.max(1, count - 1))}>
              − server
            </button>
            <button className="btn btn-sm" onClick={() => setCount(Math.min(80, count + 1))}>
              + server
            </button>
            <button className="btn btn-sm" onClick={() => setCount(Math.max(1, Math.ceil(traffic / 800)))}>
              Auto-scale
            </button>
          </div>
          <div className="sc-grid">
            {Array.from({ length: Math.min(count, 24) }).map((_, i) => {
              const dead = hDead && i === 0;
              const pct = dead ? 0 : Math.min(100, (perServer / SIZES[0].cap) * 100);
              return <span key={i} className="sc-dot" title={dead ? 'down' : `${Math.round(pct)}%`} style={{ background: dead ? 'var(--border-strong)' : pct >= 100 ? 'var(--bad)' : pct > 75 ? 'var(--warn)' : 'var(--good)' }} />;
            })}
            {count > 24 && <span className="small muted">+{count - 24} more</span>}
          </div>
          <div className="stat-row">
            <div className="stat">
              <div className="v">{hServed.toLocaleString()}</div>
              <div className="l">served req/s</div>
            </div>
            <div className="stat">
              <div className="v">${(count * SIZES[0].cost).toLocaleString()}</div>
              <div className="l">per month ({count} × Small)</div>
            </div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={() => setHDead(!hDead)}>
            {hDead ? '↺ Restore' : '💥 Crash one machine'}
          </button>
          {hDead && (
            <div className={`result-banner ${hServed >= traffic ? 'good' : 'warn'}`}>
              {hServed >= traffic ? 'One server died, the others absorbed its load. Users barely notice.' : 'One server died; the rest are overloaded. Add more servers for headroom.'}
            </div>
          )}
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        Costs are made up but realistic in shape: big machines get disproportionately expensive, and there is always a biggest one.
      </p>
    </Widget>
  );
}
