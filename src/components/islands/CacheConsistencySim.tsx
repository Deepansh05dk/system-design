import { useState } from 'react';
import Widget from './Widget';

type Strategy = 'nothing' | 'invalidate' | 'ttl';

const STRATS: Record<Strategy, { name: string; desc: string }> = {
  nothing: { name: 'Update DB only', desc: 'Write the DB, forget about the cache.' },
  ttl: { name: 'Update DB + TTL (30 s)', desc: 'Cache entries expire after 30 s, so stale data fixes itself eventually.' },
  invalidate: { name: 'Update DB + delete cache key', desc: 'After writing the DB, delete the cached key. The next read misses and loads fresh data.' },
};

export default function CacheConsistencySim() {
  const [strategy, setStrategy] = useState<Strategy>('invalidate');
  const [db, setDb] = useState(1999);
  const [cache, setCache] = useState<{ v: number; at: number } | null>({ v: 1999, at: 0 });
  const [time, setTime] = useState(0);
  const [log, setLog] = useState<{ t: string; tone?: string }[]>([]);

  const push = (t: string, tone?: string) => setLog((l) => [{ t: `[t=${time}s] ${t}`, tone }, ...l].slice(0, 7));

  const write = () => {
    const nv = db === 1999 ? 1499 : 1999;
    setDb(nv);
    if (strategy === 'invalidate') {
      setCache(null);
      push(`Price updated in DB to ₹${nv}. Cache key deleted.`);
    } else {
      push(`Price updated in DB to ₹${nv}. Cache untouched.`);
    }
  };

  const read = () => {
    const expired = strategy === 'ttl' && cache && time - cache.at >= 30;
    if (cache && !expired) {
      const stale = cache.v !== db;
      push(`Read → cache HIT → ₹${cache.v}${stale ? '  ⚠️ STALE! DB says ₹' + db : ''}`, stale ? 'bad' : 'good');
    } else {
      setCache({ v: db, at: time });
      push(`Read → cache ${expired ? 'EXPIRED' : 'MISS'} → load from DB → ₹${db} (cached now)`, 'good');
    }
  };

  const wait = () => {
    setTime((t) => t + 10);
  };

  const reset = () => {
    setDb(1999);
    setCache({ v: 1999, at: 0 });
    setTime(0);
    setLog([]);
  };

  const stale = cache && cache.v !== db;

  return (
    <Widget title="Make the cache lie, then fix it" tag="Simulator">
      <div className="widget-controls">
        <select value={strategy} onChange={(e) => { setStrategy(e.target.value as Strategy); reset(); }}>
          {Object.entries(STRATS).map(([k, s]) => (
            <option key={k} value={k}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={write}>
          ✏️ Admin changes price
        </button>
        <button className="btn" onClick={read}>
          👀 User reads price
        </button>
        <button className="btn" onClick={wait}>
          ⏩ Wait 10 s
        </button>
        <button className="btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        {STRATS[strategy].desc} Clock: <b>t = {time}s</b>
      </div>
      <div className="two-col">
        <div className={`box ${stale ? 'cc-stale' : ''}`}>
          <div className="box-title">⚡ Cache</div>
          <div className="cc-val">{cache ? `₹${cache.v}` : '(empty)'}</div>
          {cache && strategy === 'ttl' && <div className="small muted">expires in {Math.max(0, 30 - (time - cache.at))} s</div>}
          {stale && <div className="small" style={{ color: 'var(--bad)' }}>Out of date!</div>}
        </div>
        <div className="box">
          <div className="box-title">🗄️ Database (source of truth)</div>
          <div className="cc-val">₹{db}</div>
        </div>
      </div>
      {log.length > 0 && (
        <div className="log" style={{ marginTop: 10 }}>
          {log.map((l, i) => (
            <div key={i} style={{ color: l.tone === 'bad' ? 'var(--bad)' : l.tone === 'good' ? 'var(--good)' : undefined }}>
              {l.t}
            </div>
          ))}
        </div>
      )}
      <div className="small muted" style={{ marginTop: 8 }}>
        Try: change price → read. With “Update DB only” users see the old price <b>forever</b>. With TTL it’s wrong for up
        to 30 s. With invalidation the next read is fresh.
      </div>
    </Widget>
  );
}
