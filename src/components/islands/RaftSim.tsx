import { useState } from 'react';
import Widget from './Widget';

type Role = 'follower' | 'candidate' | 'leader';
interface N {
  id: number;
  role: Role;
  term: number;
  alive: boolean;
  votedFor: number | null;
  log: number;
}

const initial = (): N[] => [1, 2, 3, 4, 5].map((id) => ({ id, role: id === 1 ? 'leader' : 'follower', term: 1, alive: true, votedFor: 1, log: 3 }));

export default function RaftSim() {
  const [nodes, setNodes] = useState<N[]>(initial);
  const [msg, setMsg] = useState('Node 1 is the leader of term 1. It sends heartbeats to everyone. Try killing it.');
  const [phase, setPhase] = useState<'normal' | 'timeout' | 'voting'>('normal');
  const [candidate, setCandidate] = useState<number | null>(null);
  const [votes, setVotes] = useState<number[]>([]);

  const alive = nodes.filter((n) => n.alive);
  const leader = nodes.find((n) => n.role === 'leader' && n.alive);
  const majority = Math.floor(nodes.length / 2) + 1;

  const kill = (id: number) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, alive: !n.alive, role: n.alive ? n.role : 'follower' } : n)));
    const n = nodes.find((x) => x.id === id)!;
    if (n.alive && n.role === 'leader') {
      setMsg(`💥 Leader ${id} died. Followers stop receiving heartbeats… Press “Next step”.`);
      setPhase('timeout');
    } else if (n.alive) setMsg(`💥 Node ${id} died. The cluster still has ${alive.length - 1} of ${nodes.length} nodes.`);
    else setMsg(`↺ Node ${id} came back as a follower and will catch up from the leader.`);
  };

  const next = () => {
    if (phase === 'timeout') {
      // the follower with the shortest random timeout becomes candidate
      const followers = alive.filter((n) => n.role !== 'leader');
      if (!followers.length) return;
      const c = followers[Math.floor(Math.random() * followers.length)];
      const term = Math.max(...nodes.map((n) => n.term)) + 1;
      setCandidate(c.id);
      setVotes([c.id]);
      setNodes((ns) => ns.map((n) => (n.id === c.id ? { ...n, role: 'candidate', term, votedFor: c.id } : n)));
      setMsg(`⏰ Node ${c.id}’s election timeout fired first (timeouts are random, 150–300 ms, so usually only one node starts). It becomes a CANDIDATE for term ${term}, votes for itself and asks others for votes.`);
      setPhase('voting');
    } else if (phase === 'voting' && candidate) {
      const c = nodes.find((n) => n.id === candidate)!;
      const voters = alive.filter((n) => n.id !== candidate && n.log <= c.log).map((n) => n.id);
      const all = [candidate, ...voters];
      setVotes(all);
      if (all.length >= majority) {
        setNodes((ns) => ns.map((n) => (n.id === candidate ? { ...n, role: 'leader' } : n.alive ? { ...n, role: 'follower', term: c.term, votedFor: candidate } : n)));
        setMsg(`🗳️ Node ${candidate} got ${all.length} votes (needs a majority of ${majority} out of ${nodes.length}). It is the new LEADER for term ${c.term} and starts sending heartbeats.`);
      } else {
        setNodes((ns) => ns.map((n) => (n.id === candidate ? { ...n, role: 'follower' } : n)));
        setMsg(`🗳️ Only ${all.length} votes, needs ${majority}. No leader can be elected! With too many nodes down, the cluster refuses writes rather than risk split brain.`);
      }
      setPhase('normal');
      setCandidate(null);
    }
  };

  const write = () => {
    if (!leader) return setMsg('❌ No leader: writes are rejected.');
    const acks = alive.length;
    if (acks >= majority) {
      setNodes((ns) => ns.map((n) => (n.alive ? { ...n, log: n.log + 1 } : n)));
      setMsg(`✍️ Leader ${leader.id} appended entry #${leader.log + 1}, replicated to a majority (${acks}/${nodes.length}) → COMMITTED.`);
    } else setMsg(`✍️ Leader can’t reach a majority (${acks}/${nodes.length}). Entry not committed.`);
  };

  const R = 110;
  return (
    <Widget title="Leader election in a 5-node cluster (simplified Raft)" tag="Simulator">
      <div className="widget-controls">
        <button className="btn btn-primary" onClick={next} disabled={phase === 'normal'}>
          ▶ Next step
        </button>
        <button className="btn" onClick={write}>
          ✍️ Client write
        </button>
        <button className="btn" onClick={() => { setNodes(initial()); setPhase('normal'); setMsg('Reset. Node 1 leads term 1.'); }}>
          ↺ Reset
        </button>
        <span className="small muted">Click a node to kill / revive it.</span>
      </div>
      <div className="raft-wrap">
        <svg viewBox="0 -6 300 300" className="raft-svg">
          {leader &&
            alive
              .filter((n) => n.id !== leader.id)
              .map((n) => {
                const a = ((leader.id - 1) / 5) * Math.PI * 2 - Math.PI / 2;
                const b = ((n.id - 1) / 5) * Math.PI * 2 - Math.PI / 2;
                return (
                  <line key={n.id} x1={150 + R * Math.cos(a)} y1={146 + R * Math.sin(a)} x2={150 + R * Math.cos(b)} y2={146 + R * Math.sin(b)} stroke="var(--accent)" strokeDasharray="5 5" className="raft-hb" />
                );
              })}
          {nodes.map((n) => {
            const a = ((n.id - 1) / 5) * Math.PI * 2 - Math.PI / 2;
            const x = 150 + R * Math.cos(a);
            const y = 146 + R * Math.sin(a);
            const color = !n.alive ? 'var(--border-strong)' : n.role === 'leader' ? 'var(--warn)' : n.role === 'candidate' ? 'var(--pink)' : 'var(--accent)';
            return (
              <g key={n.id} onClick={() => kill(n.id)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r="30" fill="var(--surface)" stroke={color} strokeWidth={votes.includes(n.id) && phase !== 'normal' ? 5 : 3} />
                <text x={x} y={y - 4} textAnchor="middle" fontSize="16">
                  {!n.alive ? '💀' : n.role === 'leader' ? '👑' : n.role === 'candidate' ? '🙋' : '🖥️'}
                </text>
                <text x={x} y={y + 14} textAnchor="middle" className="af-sub">
                  N{n.id} · t{n.term}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="raft-side">
          <div className="result-banner info" style={{ marginTop: 0 }}>
            {msg}
          </div>
          <table className="sim-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>Role</th>
                <th>Term</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.id} className={!n.alive ? 'bad' : n.role === 'leader' ? 'hl' : ''}>
                  <td>N{n.id}</td>
                  <td>{n.alive ? n.role : 'down'}</td>
                  <td>{n.term}</td>
                  <td>{n.log} entries</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Widget>
  );
}
