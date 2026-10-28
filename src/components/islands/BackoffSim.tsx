import { useMemo, useState } from 'react';
import Widget from './Widget';

type Mode = 'fixed' | 'exp' | 'jitter';

const CLIENTS = 60;
const MAX_T = 32; // seconds shown

function seeded(i: number) {
  // deterministic pseudo-random per client/attempt so server and client render the same thing
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function BackoffSim() {
  const [mode, setMode] = useState<Mode>('fixed');

  const retries = useMemo(() => {
    const pts: { c: number; t: number }[] = [];
    for (let c = 0; c < CLIENTS; c++) {
      let t = 0;
      for (let a = 0; a < 6; a++) {
        let wait: number;
        if (mode === 'fixed') wait = 2;
        else if (mode === 'exp') wait = 2 ** a;
        else wait = seeded(c * 10 + a) * 2 ** (a + 1); // "full jitter": random between 0 and 2^(a+1)
        t += wait;
        if (t > MAX_T) break;
        pts.push({ c, t });
      }
    }
    return pts;
  }, [mode]);

  // retries per 1-second bucket
  const buckets = Array.from({ length: MAX_T }, (_, i) => retries.filter((p) => p.t >= i && p.t < i + 1).length);
  const peak = Math.max(...buckets);
  const total = retries.length;

  return (
    <Widget title={`The server is down. ${CLIENTS} clients retry…`} tag="Visual">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'fixed' ? 'on' : ''} onClick={() => setMode('fixed')}>
            Fixed: every 2 s
          </button>
          <button className={mode === 'exp' ? 'on' : ''} onClick={() => setMode('exp')}>
            Exponential: 1, 2, 4, 8 s…
          </button>
          <button className={mode === 'jitter' ? 'on' : ''} onClick={() => setMode('jitter')}>
            Exponential + jitter
          </button>
        </div>
      </div>
      <div className="bo-chart">
        {buckets.map((b, i) => (
          <div key={i} className="bo-col" title={`${i}–${i + 1}s: ${b} retries`}>
            <div className="bo-bar" style={{ height: `${(b / CLIENTS) * 100}%`, background: b > CLIENTS * 0.5 ? 'var(--bad)' : b > CLIENTS * 0.2 ? 'var(--warn)' : 'var(--good)' }} />
          </div>
        ))}
      </div>
      <div className="bo-axis small muted">
        <span>0 s</span>
        <span>time since failure →</span>
        <span>{MAX_T} s</span>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v" style={{ color: peak > CLIENTS * 0.5 ? 'var(--bad)' : 'var(--good)' }}>{peak}</div>
          <div className="l">Peak retries in one second</div>
        </div>
        <div className="stat">
          <div className="v">{total}</div>
          <div className="l">Total retries in {MAX_T}s</div>
        </div>
      </div>
      <div className={`result-banner ${mode === 'jitter' ? 'good' : 'bad'}`}>
        {mode === 'fixed' && 'Every client retries at the same moments: a wall of traffic every 2 seconds. The recovering server is knocked down again (a “retry storm”).'}
        {mode === 'exp' && 'Fewer total retries, but all clients still retry in sync (spikes at 1, 3, 7, 15, 31 s).'}
        {mode === 'jitter' && 'Random jitter spreads retries out. The same clients produce a gentle, flat load the server can survive.'}
      </div>
    </Widget>
  );
}
