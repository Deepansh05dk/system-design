import { useState } from 'react';
import Widget from './Widget';

const PRESETS = [99, 99.5, 99.9, 99.95, 99.99, 99.999];

function fmt(minutes: number) {
  if (minutes >= 1440) return `${(minutes / 1440).toFixed(1)} days`;
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)} hours`;
  if (minutes >= 1) return `${minutes.toFixed(1)} min`;
  return `${(minutes * 60).toFixed(0)} sec`;
}

interface Comp {
  name: string;
  a: number;
}

export default function NinesCalc() {
  const [a, setA] = useState(99.9);
  const [chain, setChain] = useState<Comp[]>([
    { name: 'Load balancer', a: 99.99 },
    { name: 'App servers', a: 99.9 },
    { name: 'Database', a: 99.95 },
  ]);
  const [redundant, setRedundant] = useState(false);

  const down = (pct: number) => ({
    year: (1 - pct / 100) * 365 * 24 * 60,
    month: (1 - pct / 100) * 30 * 24 * 60,
    day: (1 - pct / 100) * 24 * 60,
  });
  const d = down(a);

  const effective = chain.map((c) => (redundant ? 100 - ((100 - c.a) / 100) ** 2 * 100 : c.a));
  const serial = effective.reduce((acc, x) => acc * (x / 100), 1) * 100;

  return (
    <Widget title="What do the “nines” really mean?" tag="Calculator">
      <div className="widget-controls">
        <span className="small muted">Availability:</span>
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button key={p} className={a === p ? 'on' : ''} onClick={() => setA(p)}>
              {p}%
            </button>
          ))}
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{fmt(d.year)}</div>
          <div className="l">Downtime / year</div>
        </div>
        <div className="stat">
          <div className="v">{fmt(d.month)}</div>
          <div className="l">Downtime / month</div>
        </div>
        <div className="stat">
          <div className="v">{fmt(d.day)}</div>
          <div className="l">Downtime / day</div>
        </div>
      </div>
      <div className="box" style={{ marginTop: 12 }}>
        <div className="box-title">Components in a chain: availability multiplies</div>
        {chain.map((c, i) => (
          <div key={c.name} className="nines-row">
            <span>{c.name}</span>
            <select value={c.a} onChange={(e) => setChain(chain.map((x, j) => (j === i ? { ...x, a: +e.target.value } : x)))}>
              {PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
            {redundant && <span className="small" style={{ color: 'var(--good)' }}>×2 in parallel → {effective[i].toFixed(4)}%</span>}
          </div>
        ))}
        <label className="small" style={{ display: 'block', margin: '6px 0' }}>
          <input type="checkbox" checked={redundant} onChange={(e) => setRedundant(e.target.checked)} /> Run two independent copies of each component (parallel redundancy)
        </label>
        <div className={`result-banner ${serial >= 99.9 ? 'good' : 'warn'}`}>
          Whole request path: {chain.map((c, i) => `${effective[i].toFixed(redundant ? 4 : 2)}%`).join(' × ')} = <b>{serial.toFixed(3)}%</b> → about <b>{fmt(down(serial).year)}</b> of downtime per year.
          {!redundant && ' Every component in series makes the total WORSE than its weakest part.'}
          {redundant && ' Two copies only fail together if both fail: 1 − (1 − A)². Redundancy is how you buy nines.'}
        </div>
      </div>
    </Widget>
  );
}
