import { useEffect, useState } from 'react';
import Widget from './Widget';

interface Node {
  name: string;
  value: number;
  role: 'leader' | 'follower';
  alive: boolean;
}
interface Pending {
  to: string;
  value: number;
  at: number;
}

export default function ReplicationSim() {
  const [mode, setMode] = useState<'async' | 'sync'>('async');
  const [lag, setLag] = useState(3);
  const [nodes, setNodes] = useState<Node[]>([
    { name: 'DB-1', value: 0, role: 'leader', alive: true },
    { name: 'DB-2', value: 0, role: 'follower', alive: true },
    { name: 'DB-3', value: 0, role: 'follower', alive: true },
  ]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [t, setT] = useState(0);
  const [log, setLog] = useState<{ text: string; tone?: string }[]>([]);
  const [counter, setCounter] = useState(0);

  const say = (text: string, tone?: string) => setLog((l) => [{ text, tone }, ...l].slice(0, 7));

  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 500);
    return () => clearInterval(id);
  }, []);

  // deliver replication messages
  useEffect(() => {
    const due = pending.filter((p) => p.at <= t);
    if (!due.length) return;
    setNodes((ns) =>
      ns.map((n) => {
        const d = due.filter((p) => p.to === n.name && n.alive);
        return d.length ? { ...n, value: Math.max(n.value, ...d.map((x) => x.value)) } : n;
      }),
    );
    setPending((ps) => ps.filter((p) => p.at > t));
  }, [t]);

  const leader = nodes.find((n) => n.role === 'leader' && n.alive);

  const write = () => {
    if (!leader) {
      say('❌ No leader! Writes are failing. Promote a follower first.', 'bad');
      return;
    }
    const v = counter + 1;
    setCounter(v);
    setNodes((ns) => ns.map((n) => (n.name === leader.name ? { ...n, value: v } : n)));
    const followers = nodes.filter((n) => n.role === 'follower' && n.alive);
    if (mode === 'sync') {
      setNodes((ns) => ns.map((n) => (n.alive ? { ...n, value: v } : n)));
      say(`✍️ Write #${v}: leader waited ~${(lag * 0.5).toFixed(1)}s for ${followers.length} follower(s) to confirm. Slower write, but every live copy has it.`, 'warn');
    } else {
      setPending((ps) => [...ps, ...followers.map((f) => ({ to: f.name, value: v, at: t + lag + Math.floor(Math.random() * 2) }))]);
      say(`✍️ Write #${v}: leader confirmed immediately. Followers will get it in ~${(lag * 0.5).toFixed(1)}s.`, 'good');
    }
  };

  const read = (name: string) => {
    const n = nodes.find((x) => x.name === name)!;
    if (!n.alive) return say(`❌ ${name} is down.`, 'bad');
    const stale = n.value < counter;
    say(`👀 Read from ${name} (${n.role}) → #${n.value}${stale ? `  ⚠️ STALE (latest is #${counter})` : '  ✓ fresh'}`, stale ? 'bad' : 'good');
  };

  const kill = (name: string) => {
    setNodes((ns) => ns.map((n) => (n.name === name ? { ...n, alive: !n.alive } : n)));
    const n = nodes.find((x) => x.name === name)!;
    say(n.alive ? `💥 ${name} crashed.` : `↺ ${name} is back.`, n.alive ? 'bad' : undefined);
  };

  const promote = () => {
    const candidates = nodes.filter((n) => n.alive && n.role === 'follower').sort((a, b) => b.value - a.value);
    if (!candidates.length) return;
    const best = candidates[0];
    const lost = counter - best.value;
    setNodes((ns) => ns.map((n) => (n.name === best.name ? { ...n, role: 'leader' } : n.role === 'leader' ? { ...n, role: 'follower' } : n)));
    setCounter(best.value);
    say(
      `👑 Failover: ${best.name} promoted to leader (it had #${best.value}).${lost > 0 ? ` ${lost} acknowledged write(s) were LOST because they never reached it (async replication).` : ' No data lost.'}`,
      lost > 0 ? 'bad' : 'good',
    );
  };

  const reset = () => {
    setNodes([
      { name: 'DB-1', value: 0, role: 'leader', alive: true },
      { name: 'DB-2', value: 0, role: 'follower', alive: true },
      { name: 'DB-3', value: 0, role: 'follower', alive: true },
    ]);
    setPending([]);
    setCounter(0);
    setLog([]);
  };

  return (
    <Widget title="Leader–follower replication" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'async' ? 'on' : ''} onClick={() => setMode('async')}>
            Async replication
          </button>
          <button className={mode === 'sync' ? 'on' : ''} onClick={() => setMode('sync')}>
            Sync replication
          </button>
        </div>
        <label>
          Replication lag: <b>{(lag * 0.5).toFixed(1)} s</b>
          <input type="range" min={1} max={10} value={lag} onChange={(e) => setLag(+e.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={write}>
          ✍️ Write
        </button>
        <button className="btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div className="rep-nodes">
        {nodes.map((n) => {
          const inflight = pending.filter((p) => p.to === n.name).length;
          return (
            <div key={n.name} className={`rep-node ${n.role} ${!n.alive ? 'dead' : ''}`}>
              <div className="rep-head">
                {n.alive ? (n.role === 'leader' ? '👑' : '📄') : '💀'} <b>{n.name}</b>
                <span className={`pill ${n.role === 'leader' ? '' : 'pill-good'}`}>{n.role}</span>
              </div>
              <div className="rep-val">#{n.value}</div>
              <div className="small muted">{inflight ? `⏳ ${inflight} change(s) in flight` : n.value < counter && n.alive ? 'behind' : 'up to date'}</div>
              <div className="sim-row" style={{ marginTop: 6 }}>
                <button className="btn btn-sm" onClick={() => read(n.name)}>
                  👀 Read
                </button>
                <button className="btn btn-sm" onClick={() => kill(n.name)}>
                  {n.alive ? '💥' : '↺'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {!leader && (
        <div className="result-banner bad">
          The leader is down. Writes fail until a follower is promoted.{' '}
          <button className="btn btn-sm" onClick={promote}>
            👑 Promote best follower
          </button>
        </div>
      )}
      <div className="log" style={{ marginTop: 10 }}>
        {log.length ? (
          log.map((l, i) => (
            <div key={i} style={{ color: l.tone === 'bad' ? 'var(--bad)' : l.tone === 'good' ? 'var(--good)' : l.tone === 'warn' ? 'var(--warn)' : undefined }}>
              {l.text}
            </div>
          ))
        ) : (
          <div className="muted">Try: Write, then immediately Read from a follower. Then: write, kill the leader fast, promote.</div>
        )}
      </div>
    </Widget>
  );
}
