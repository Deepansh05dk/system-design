import { useMemo, useState } from 'react';
import Widget from './Widget';

type Strategy = 'range' | 'hash' | 'directory';

const USERS = ['aarav', 'aditi', 'arjun', 'ananya', 'amit', 'bhavna', 'chirag', 'deepa', 'esha', 'farhan', 'gita', 'harsh', 'isha', 'jatin', 'kavya', 'lalit', 'mohan', 'neha', 'om', 'pooja', 'rahul', 'sana', 'tara', 'uday', 'varun', 'yash', 'zara', 'akash', 'anil', 'asha'];

function h(s: string) {
  let x = 2166136261;
  for (const c of s) {
    x ^= c.charCodeAt(0);
    x = Math.imul(x, 16777619) >>> 0;
  }
  return x;
}

export default function ShardingSim() {
  const [strategy, setStrategy] = useState<Strategy>('hash');
  const [shards, setShards] = useState(3);
  const [celebrity, setCelebrity] = useState(false);
  const [prevShards, setPrevShards] = useState<number | null>(null);

  const place = (u: string, n: number): number => {
    if (strategy === 'range') {
      const c = u.charCodeAt(0) - 97;
      return Math.min(n - 1, Math.floor((c / 26) * n));
    }
    if (strategy === 'hash') return h(u) % n;
    // directory: a lookup table assigned round-robin at signup, then stored
    return USERS.indexOf(u) % n;
  };

  const assignment = useMemo(() => USERS.map((u) => ({ u, s: place(u, shards) })), [strategy, shards]);
  const moved = prevShards ? USERS.filter((u) => place(u, prevShards) !== place(u, shards)).length : 0;

  const load = Array.from({ length: shards }, (_, i) => {
    const members = assignment.filter((a) => a.s === i);
    const traffic = members.reduce((s, m) => s + (celebrity && m.u === 'asha' ? 60 : 1), 0);
    return { members, traffic };
  });
  const maxT = Math.max(...load.map((l) => l.traffic));
  const totalT = load.reduce((s, l) => s + l.traffic, 0);

  const change = (n: number) => {
    setPrevShards(shards);
    setShards(n);
  };

  return (
    <Widget title="Split 30 users across database shards" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={strategy === 'range' ? 'on' : ''} onClick={() => { setStrategy('range'); setPrevShards(null); }}>
            Range (A–Z)
          </button>
          <button className={strategy === 'hash' ? 'on' : ''} onClick={() => { setStrategy('hash'); setPrevShards(null); }}>
            Hash mod N
          </button>
          <button className={strategy === 'directory' ? 'on' : ''} onClick={() => { setStrategy('directory'); setPrevShards(null); }}>
            Directory
          </button>
        </div>
        <button className="btn btn-sm" onClick={() => change(Math.max(2, shards - 1))}>
          − shard
        </button>
        <button className="btn btn-sm" onClick={() => change(Math.min(6, shards + 1))}>
          + shard
        </button>
        <label>
          <input type="checkbox" checked={celebrity} onChange={(e) => setCelebrity(e.target.checked)} /> “asha” goes viral (60× traffic)
        </label>
      </div>
      <div className="shard-grid" style={{ gridTemplateColumns: `repeat(${shards}, 1fr)` }}>
        {load.map((l, i) => {
          const pct = (l.traffic / totalT) * 100;
          const hot = l.traffic === maxT && maxT > (totalT / shards) * 1.6;
          return (
            <div key={i} className={`shard ${hot ? 'hot' : ''}`}>
              <div className="shard-head">
                🗄️ Shard {i + 1} {hot && '🔥'}
              </div>
              <div className="meter" style={{ margin: '4px 0' }}>
                <div style={{ width: `${pct}%`, background: hot ? 'var(--bad)' : 'var(--accent)' }} />
              </div>
              <div className="small muted">
                {l.members.length} users · {Math.round(pct)}% traffic
              </div>
              <div className="shard-users">
                {l.members.map((m) => (
                  <span key={m.u} className={`chip ${celebrity && m.u === 'asha' ? 'bad' : ''}`} style={{ height: 22, fontSize: '0.68rem' }}>
                    {m.u}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {prevShards && prevShards !== shards && strategy !== 'directory' && (
        <div className={`result-banner ${moved > USERS.length / 2 ? 'bad' : 'warn'}`}>
          Changed from {prevShards} → {shards} shards: <b>{moved} of {USERS.length}</b> users ({Math.round((moved / USERS.length) * 100)}%) had to
          move to a different shard.{strategy === 'hash' && ' That’s the big weakness of hash mod N, and why consistent hashing exists (next lesson).'}
        </div>
      )}
      <div className="result-banner info">
        {strategy === 'range' && 'Range: easy to understand and great for range scans, but unbalanced. Many names start with “a”, so shard 1 is overloaded.'}
        {strategy === 'hash' && 'Hash: spreads keys evenly, but range queries need to hit every shard, and changing N moves most keys.'}
        {strategy === 'directory' && 'Directory: a lookup service stores user → shard. Fully flexible (move anyone anywhere), but the directory is an extra hop and must itself be highly available.'}
        {celebrity && ' A single hot key overloads its shard no matter the strategy. Fixes: cache it, replicate it, or split that key further.'}
      </div>
    </Widget>
  );
}
