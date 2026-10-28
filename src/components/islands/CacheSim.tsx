import { useState } from 'react';
import Widget from './Widget';

type Policy = 'LRU' | 'LFU' | 'FIFO';
interface Entry {
  key: string;
  addedAt: number;
  lastUsed: number;
  uses: number;
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const DB_MS = 50;
const CACHE_MS = 1;

export default function CacheSim() {
  const [policy, setPolicy] = useState<Policy>('LRU');
  const [cap, setCap] = useState(3);
  const [cache, setCache] = useState<Entry[]>([]);
  const [clock, setClock] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [msg, setMsg] = useState<{ text: string; tone: 'good' | 'bad' | 'warn' } | null>(null);
  const [history, setHistory] = useState<{ k: string; hit: boolean }[]>([]);

  const victim = (c: Entry[]) => {
    const sorted = [...c].sort((a, b) => {
      if (policy === 'LRU') return a.lastUsed - b.lastUsed;
      if (policy === 'FIFO') return a.addedAt - b.addedAt;
      return a.uses - b.uses || a.lastUsed - b.lastUsed;
    });
    return sorted[0];
  };

  const access = (key: string, state = { cache, clock, hits, misses, history }) => {
    const now = state.clock + 1;
    const found = state.cache.find((e) => e.key === key);
    let next = state.cache;
    let m: typeof msg;
    if (found) {
      next = state.cache.map((e) => (e.key === key ? { ...e, lastUsed: now, uses: e.uses + 1 } : e));
      m = { text: `HIT: ${key} was in the cache → ~${CACHE_MS} ms`, tone: 'good' };
    } else {
      let evicted = '';
      if (state.cache.length >= cap) {
        const v = victim(state.cache);
        evicted = v.key;
        next = state.cache.filter((e) => e.key !== v.key);
      }
      next = [...next, { key, addedAt: now, lastUsed: now, uses: 1 }];
      m = {
        text: `MISS: ${key} not in cache → read DB (~${DB_MS} ms), then store it.${evicted ? ` Cache full, evicted ${evicted} (${policy}).` : ''}`,
        tone: evicted ? 'warn' : 'bad',
      };
    }
    return {
      cache: next,
      clock: now,
      hits: state.hits + (found ? 1 : 0),
      misses: state.misses + (found ? 0 : 1),
      history: [...state.history, { k: key, hit: !!found }].slice(-24),
      msg: m,
    };
  };

  const apply = (r: ReturnType<typeof access>) => {
    setCache(r.cache);
    setClock(r.clock);
    setHits(r.hits);
    setMisses(r.misses);
    setHistory(r.history);
    setMsg(r.msg);
  };

  const burst = () => {
    // skewed traffic: A and B are “hot” (popular), others rare
    let s = { cache, clock, hits, misses, history, msg };
    for (let i = 0; i < 20; i++) {
      const r = Math.random();
      const k = r < 0.35 ? 'A' : r < 0.6 ? 'B' : KEYS[2 + Math.floor(Math.random() * 5)];
      s = access(k, s);
    }
    apply(s);
    setMsg({ text: 'Sent 20 requests with realistic skew: A and B are popular, C–G are rare.', tone: 'good' });
  };

  const reset = () => {
    setCache([]);
    setClock(0);
    setHits(0);
    setMisses(0);
    setHistory([]);
    setMsg(null);
  };

  const total = hits + misses;
  const rate = total ? Math.round((hits / total) * 100) : 0;
  const avg = total ? (hits * CACHE_MS + misses * DB_MS) / total : 0;
  const order = [...cache].sort((a, b) => {
    if (policy === 'LRU') return b.lastUsed - a.lastUsed;
    if (policy === 'FIFO') return b.addedAt - a.addedAt;
    return b.uses - a.uses || b.lastUsed - a.lastUsed;
  });
  const next = cache.length >= cap ? victim(cache)?.key : null;

  return (
    <Widget title="A tiny cache in front of a slow database" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          {(['LRU', 'LFU', 'FIFO'] as Policy[]).map((p) => (
            <button key={p} className={policy === p ? 'on' : ''} onClick={() => setPolicy(p)}>
              {p}
            </button>
          ))}
        </div>
        <label>
          Capacity
          <select value={cap} onChange={(e) => { setCap(+e.target.value); reset(); }}>
            {[2, 3, 4, 5].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={burst}>
          🎲 20 realistic requests
        </button>
        <button className="btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div className="widget-controls">
        <span className="small muted">Request key:</span>
        {KEYS.map((k) => (
          <button key={k} className="btn btn-sm" onClick={() => apply(access(k))}>
            GET {k}
          </button>
        ))}
      </div>
      <div className="cache-stage">
        <div className="box" style={{ flex: 1 }}>
          <div className="box-title">
            ⚡ Cache ({cache.length}/{cap}) · ordered by {policy === 'LRU' ? 'most recently used' : policy === 'LFU' ? 'most frequently used' : 'newest first'}
          </div>
          <div className="sim-row">
            {Array.from({ length: cap }).map((_, i) => {
              const e = order[i];
              return e ? (
                <span key={e.key} className={`chip cache-chip ${e.key === next ? 'bad' : 'accent'} fade-in`}>
                  {e.key}
                  <small>{policy === 'LFU' ? `×${e.uses}` : policy === 'LRU' ? `t${e.lastUsed}` : `in t${e.addedAt}`}</small>
                </span>
              ) : (
                <span key={`empty${i}`} className="chip ghost cache-chip">
                  empty
                </span>
              );
            })}
          </div>
          {next && <div className="small" style={{ color: 'var(--bad)', marginTop: 6 }}>Next to be evicted: {next}</div>}
        </div>
        <div className="cache-arrow">⇄</div>
        <div className="box cache-db">
          <div className="box-title">🗄️ Database</div>
          <div className="small">Has every key. ~{DB_MS} ms per read.</div>
        </div>
      </div>
      {msg && <div className={`result-banner ${msg.tone}`}>{msg.text}</div>}
      <div className="stat-row">
        <div className="stat">
          <div className="v" style={{ color: 'var(--good)' }}>{hits}</div>
          <div className="l">Hits</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: 'var(--bad)' }}>{misses}</div>
          <div className="l">Misses</div>
        </div>
        <div className="stat">
          <div className="v">{rate}%</div>
          <div className="l">Hit rate</div>
        </div>
        <div className="stat">
          <div className="v">{avg.toFixed(1)} ms</div>
          <div className="l">Avg latency</div>
        </div>
      </div>
      {history.length > 0 && (
        <div className="sim-row" style={{ gap: 3 }}>
          {history.map((h, i) => (
            <span key={i} className={`chip ${h.hit ? 'good' : 'bad'}`} style={{ minWidth: 24, height: 24, fontSize: '0.7rem' }}>
              {h.k}
            </span>
          ))}
        </div>
      )}
    </Widget>
  );
}
