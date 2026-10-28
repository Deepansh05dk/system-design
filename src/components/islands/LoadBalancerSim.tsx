import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

type Algo = 'rr' | 'least' | 'hash' | 'random' | 'weighted';
interface Srv {
  id: number;
  name: string;
  weight: number;
  healthy: boolean;
  markedDown: boolean;
  active: { user: string; ends: number }[];
  served: number;
}

const USERS = [
  { name: 'Asha', color: '#0ea5e9' },
  { name: 'Ravi', color: '#f59e0b' },
  { name: 'Meera', color: '#ec4899' },
  { name: 'Karan', color: '#10b981' },
  { name: 'Li', color: '#8b5cf6' },
];

const ALGOS: Record<Algo, { name: string; desc: string }> = {
  rr: { name: 'Round robin', desc: 'Take turns: 1, 2, 3, 1, 2, 3… Simple and fair when requests are similar.' },
  weighted: { name: 'Weighted RR', desc: 'Bigger servers get more turns (server 1 has weight 2 here).' },
  least: { name: 'Least connections', desc: 'Send to the server with the fewest requests in progress. Great when some requests are slow.' },
  hash: { name: 'IP / user hash', desc: 'hash(user) picks the server, so the same user always lands on the same server (“sticky”).' },
  random: { name: 'Random', desc: 'Pick any healthy server. Surprisingly OK at large scale, but uneven in the short run.' },
};

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

const initial = (): Srv[] =>
  [1, 2, 3].map((i) => ({ id: i, name: `Server ${i}`, weight: i === 1 ? 2 : 1, healthy: true, markedDown: false, active: [], served: 0 }));

export default function LoadBalancerSim() {
  const [algo, setAlgo] = useState<Algo>('rr');
  const [servers, setServers] = useState<Srv[]>(initial);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [failed, setFailed] = useState(0);
  const rr = useRef(0);

  // clock
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 250);
    return () => clearInterval(t);
  }, []);

  // finish requests, health checks
  useEffect(() => {
    setServers((ss) =>
      ss.map((s) => ({
        ...s,
        active: s.healthy ? s.active.filter((a) => a.ends > tick) : [],
        markedDown: tick % 8 === 0 ? !s.healthy : s.markedDown,
      })),
    );
    if (auto && tick % 2 === 0) send();
  }, [tick]);

  const pick = (ss: Srv[], user: string): Srv | null => {
    const pool = ss.filter((s) => !s.markedDown);
    if (!pool.length) return null;
    switch (algo) {
      case 'rr':
        return pool[rr.current++ % pool.length];
      case 'weighted': {
        const expanded = pool.flatMap((s) => Array(s.weight).fill(s));
        return expanded[rr.current++ % expanded.length];
      }
      case 'least':
        return [...pool].sort((a, b) => a.active.length - b.active.length || a.id - b.id)[0];
      case 'hash':
        return pool[hash(user) % pool.length];
      case 'random':
        return pool[Math.floor(Math.random() * pool.length)];
    }
  };

  const send = () => {
    const u = USERS[Math.floor(Math.random() * USERS.length)];
    const slow = Math.random() < 0.25;
    const dur = slow ? 14 + Math.floor(Math.random() * 10) : 3 + Math.floor(Math.random() * 3);
    setServers((ss) => {
      const target = pick(ss, u.name);
      if (!target) {
        setLog((l) => [`❌ ${u.name}: no healthy servers → 503`, ...l].slice(0, 6));
        setFailed((f) => f + 1);
        return ss;
      }
      if (!target.healthy) {
        setLog((l) => [`💥 ${u.name} → ${target.name} (dead, not detected yet) → error`, ...l].slice(0, 6));
        setFailed((f) => f + 1);
        return ss;
      }
      setLog((l) => [`${u.name} → ${target.name}${slow ? ' (slow request 🐢)' : ''}`, ...l].slice(0, 6));
      return ss.map((s) => (s.id === target.id ? { ...s, served: s.served + 1, active: [...s.active, { user: u.name, ends: tick + dur }] } : s));
    });
  };

  const toggleHealth = (id: number) => setServers((ss) => ss.map((s) => (s.id === id ? { ...s, healthy: !s.healthy } : s)));
  const addServer = () =>
    setServers((ss) => (ss.length >= 5 ? ss : [...ss, { id: ss.length + 1, name: `Server ${ss.length + 1}`, weight: 1, healthy: true, markedDown: false, active: [], served: 0 }]));
  const reset = () => {
    setServers(initial());
    setLog([]);
    setFailed(0);
    rr.current = 0;
  };

  return (
    <Widget title="Be the load balancer" tag="Simulator">
      <div className="widget-controls">
        <select value={algo} onChange={(e) => setAlgo(e.target.value as Algo)}>
          {Object.entries(ALGOS).map(([k, a]) => (
            <option key={k} value={k}>
              {a.name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={send}>
          ➕ Send request
        </button>
        <button className="btn" onClick={() => setAuto(!auto)}>
          {auto ? '⏸ Stop traffic' : '▶ Auto traffic'}
        </button>
        <button className="btn" onClick={addServer} disabled={servers.length >= 5}>
          + Add server
        </button>
        <button className="btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div className="result-banner info" style={{ marginTop: 0, marginBottom: 10 }}>
        <b>{ALGOS[algo].name}:</b> {ALGOS[algo].desc}
      </div>
      <div className="lb-stage">
        <div className="lb-users">
          {USERS.map((u) => (
            <span key={u.name} className="lb-user" style={{ borderColor: u.color, color: u.color }}>
              👤 {u.name}
            </span>
          ))}
        </div>
        <div className="lb-box">⚖️ Load balancer</div>
        <div className="lb-servers">
          {servers.map((s) => (
            <div key={s.id} className={`lb-server ${!s.healthy ? 'dead' : ''} ${s.markedDown ? 'out' : ''}`}>
              <div className="lb-srv-head">
                <b>
                  {s.healthy ? '🖥️' : '💀'} {s.name}
                </b>
                {algo === 'weighted' && <span className="pill">w={s.weight}</span>}
              </div>
              <div className="lb-slots">
                {s.active.map((a, i) => (
                  <span key={i} className="lb-req" style={{ background: USERS.find((u) => u.name === a.user)!.color }} title={a.user} />
                ))}
              </div>
              <div className="small muted">
                {s.active.length} active · {s.served} served
              </div>
              <div className="small" style={{ color: s.markedDown ? 'var(--bad)' : 'var(--good)' }}>
                health check: {s.markedDown ? 'DOWN (removed)' : 'OK'}
              </div>
              <button className="btn btn-sm" onClick={() => toggleHealth(s.id)}>
                {s.healthy ? '💥 Kill' : '↺ Revive'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="two-col" style={{ marginTop: 10 }}>
        <div className="log">
          {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <div className="muted">Send some requests…</div>}
        </div>
        <div className="small">
          <b>Failed requests: {failed}</b>
          <div className="muted">
            Kill a server and keep sending. Requests fail until the next health check (every ~2 s) marks it down. Then the
            load balancer stops sending traffic to it. Try “Least connections” with auto traffic and notice how it avoids
            servers stuck on slow 🐢 requests.
          </div>
        </div>
      </div>
    </Widget>
  );
}
