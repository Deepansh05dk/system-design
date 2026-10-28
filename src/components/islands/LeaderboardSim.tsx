import { useState } from 'react';
import Widget from './Widget';

const INIT: [string, number][] = [
  ['asha', 4200],
  ['ravi', 3900],
  ['meera', 3650],
  ['karan', 3100],
  ['li', 2800],
  ['omar', 2500],
  ['zoe', 2100],
  ['dev', 1700],
];

export default function LeaderboardSim() {
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(INIT));
  const [me, setMe] = useState('karan');
  const [log, setLog] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const rank = ranked.findIndex(([n]) => n === me);

  const add = (name: string, pts: number) => {
    const next = { ...scores, [name]: scores[name] + pts };
    setScores(next);
    setFlash(name);
    setTimeout(() => setFlash(null), 600);
    setLog((l) => [`ZINCRBY leaderboard ${pts} ${name}   → ${next[name]}   (O(log N))`, ...l].slice(0, 5));
  };

  const around = ranked.slice(Math.max(0, rank - 1), rank + 2);

  return (
    <Widget title="A real-time leaderboard with a Redis sorted set" tag="Playground">
      <div className="widget-controls">
        <span className="small muted">Award points:</span>
        {Object.keys(scores).slice(0, 6).map((n) => (
          <button key={n} className="btn btn-sm" onClick={() => add(n, 100 + Math.floor(Math.random() * 600))}>
            🎮 {n}
          </button>
        ))}
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">ZREVRANGE leaderboard 0 4 WITHSCORES (top 5)</div>
          {ranked.slice(0, 5).map(([n, s], i) => (
            <div key={n} className={`lb-rank ${flash === n ? 'flash' : ''} ${n === me ? 'me' : ''}`}>
              <span className="lb-pos">{['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`}</span>
              <span>{n}</span>
              <b>{s.toLocaleString()}</b>
            </div>
          ))}
        </div>
        <div className="box">
          <div className="box-title">
            My rank: ZREVRANK leaderboard{' '}
            <select value={me} onChange={(e) => setMe(e.target.value)}>
              {Object.keys(scores).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="lb-myrank">#{rank + 1}</div>
          <div className="small muted" style={{ marginBottom: 6 }}>
            Players around me:
          </div>
          {around.map(([n, s]) => (
            <div key={n} className={`lb-rank ${n === me ? 'me' : ''}`}>
              <span className="lb-pos">#{ranked.findIndex(([x]) => x === n) + 1}</span>
              <span>{n}</span>
              <b>{s.toLocaleString()}</b>
            </div>
          ))}
        </div>
      </div>
      {log.length > 0 && (
        <div className="log" style={{ marginTop: 8 }}>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
      <div className="result-banner info">
        A sorted set keeps members ordered by score (a skip list inside). Updating a score, getting a rank, or reading the top N are all
        O(log N), so even 100M players answer in about a millisecond. A SQL <code>ORDER BY score</code> over 100M rows on every request could not.
      </div>
    </Widget>
  );
}
