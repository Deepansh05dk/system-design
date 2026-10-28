import { useState } from 'react';
import Widget from './Widget';

type Strategy = 'none' | 'lock' | 'swr' | 'jitter';

const INFO: Record<Strategy, { name: string; desc: string }> = {
  none: { name: 'Nothing', desc: 'All requests that miss go straight to the database.' },
  lock: { name: 'Single-flight lock', desc: 'The first request that misses takes a short lock (e.g. Redis SET NX) and rebuilds the value. Others wait briefly or get the old value.' },
  swr: { name: 'Stale-while-revalidate', desc: 'Keep serving the expired (stale) value while ONE background job refreshes it. Users never wait.' },
  jitter: { name: 'TTL jitter', desc: 'Give each key a slightly random TTL (e.g. 300 ± 30 s) so thousands of keys don’t expire in the same second.' },
};

export default function StampedeSim() {
  const [strategy, setStrategy] = useState<Strategy>('none');
  const [rps, setRps] = useState(5000);
  const [ran, setRan] = useState<{ db: number; slowUsers: number; staleUsers: number } | null>(null);

  const run = () => {
    // rebuilding the value takes 200 ms. During that window, rps * 0.2 requests arrive.
    const inWindow = Math.round(rps * 0.2);
    let db = 0;
    let slowUsers = 0;
    let staleUsers = 0;
    if (strategy === 'none') {
      db = inWindow;
      slowUsers = inWindow;
    } else if (strategy === 'lock') {
      db = 1;
      slowUsers = inWindow;
    } else if (strategy === 'swr') {
      db = 1;
      staleUsers = inWindow;
    } else {
      // jitter helps when MANY keys expire together, not for one hot key
      db = inWindow;
      slowUsers = inWindow;
    }
    setRan({ db, slowUsers, staleUsers });
  };

  const dots = ran ? Math.min(ran.db, 400) : 0;

  return (
    <Widget title="A hot cache key expires…" tag="Simulator">
      <div className="widget-controls">
        <label>
          Traffic on this key: <b>{rps.toLocaleString()} req/s</b>
          <input type="range" min={100} max={20000} step={100} value={rps} onChange={(e) => { setRps(+e.target.value); setRan(null); }} />
        </label>
      </div>
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(INFO) as Strategy[]).map((s) => (
            <button key={s} className={strategy === s ? 'on' : ''} onClick={() => { setStrategy(s); setRan(null); }}>
              {INFO[s].name}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={run}>
          ⏰ Expire the key
        </button>
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        {INFO[strategy].desc} Rebuilding the value takes 200 ms.
      </div>
      {ran && (
        <>
          <div className="box">
            <div className="box-title">Queries that hit the database</div>
            <div className="st-dots">
              {Array.from({ length: dots }).map((_, i) => (
                <span key={i} className="st-dot" style={{ animationDelay: `${(i % 50) * 8}ms` }} />
              ))}
              {ran.db > 400 && <span className="small muted">+{(ran.db - 400).toLocaleString()} more</span>}
            </div>
          </div>
          <div className="stat-row">
            <div className="stat">
              <div className="v" style={{ color: ran.db > 10 ? 'var(--bad)' : 'var(--good)' }}>{ran.db.toLocaleString()}</div>
              <div className="l">DB queries for one value</div>
            </div>
            <div className="stat">
              <div className="v">{ran.slowUsers.toLocaleString()}</div>
              <div className="l">Users who waited</div>
            </div>
            <div className="stat">
              <div className="v">{ran.staleUsers.toLocaleString()}</div>
              <div className="l">Users served slightly stale data</div>
            </div>
          </div>
          <div className={`result-banner ${ran.db > 10 ? 'bad' : 'good'}`}>
            {strategy === 'none' && `Stampede! ${ran.db.toLocaleString()} identical queries hit the DB at once. It slows down, rebuilding takes longer, even more requests pile up…`}
            {strategy === 'lock' && 'Only one request rebuilds. Others wait ~200 ms (or get a stale copy). The database is safe.'}
            {strategy === 'swr' && 'One background refresh, zero waiting. Users see a value a few seconds old, which is fine for most data.'}
            {strategy === 'jitter' &&
              'Jitter doesn’t help a SINGLE hot key. It prevents many keys (e.g. all products cached at deploy time) from expiring in the same second. Combine it with a lock or SWR.'}
          </div>
        </>
      )}
    </Widget>
  );
}
