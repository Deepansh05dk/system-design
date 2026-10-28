import { useState } from 'react';
import Widget from './Widget';

type Mode = 'CP' | 'AP';

export default function CapSim() {
  const [mode, setMode] = useState<Mode>('CP');
  const [partition, setPartition] = useState(false);
  const [a, setA] = useState(10);
  const [b, setB] = useState(10);
  const [pendingSync, setPendingSync] = useState(false);
  const [log, setLog] = useState<{ t: string; tone?: string }[]>([]);

  const say = (t: string, tone?: string) => setLog((l) => [{ t, tone }, ...l].slice(0, 6));

  const write = () => {
    const nv = a + 1;
    if (!partition) {
      setA(nv);
      setB(nv);
      say(`✍️ Write value=${nv} on Node A → replicated to Node B. Both agree.`, 'good');
      return;
    }
    if (mode === 'CP') {
      say('⛔ Write rejected: Node A cannot reach Node B to confirm. Choosing Consistency → refuse the write (error / timeout).', 'bad');
    } else {
      setA(nv);
      setPendingSync(true);
      say(`✍️ Write value=${nv} accepted on Node A only (B unreachable). Choosing Availability → accept and sync later.`, 'warn');
    }
  };

  const readB = () => {
    if (!partition) {
      say(`👀 Read from Node B → ${b}. ✓ latest`, 'good');
      return;
    }
    if (mode === 'CP') {
      say('⛔ Node B refuses to answer: it can’t be sure it has the latest data. (Unavailable, but never wrong.)', 'bad');
    } else {
      say(`👀 Read from Node B → ${b}${b !== a ? `  ⚠️ STALE (A has ${a})` : ''}. (Available, but maybe wrong.)`, b !== a ? 'warn' : 'good');
    }
  };

  const heal = () => {
    setPartition(false);
    if (pendingSync) {
      setB(a);
      setPendingSync(false);
      say(`🔗 Network healed. Node B syncs to ${a}. Copies converge (eventual consistency).`, 'good');
    } else say('🔗 Network healed.', 'good');
  };

  return (
    <Widget title="Cut the network, then choose: C or A?" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'CP' ? 'on' : ''} onClick={() => setMode('CP')}>
            CP: prefer Consistency
          </button>
          <button className={mode === 'AP' ? 'on' : ''} onClick={() => setMode('AP')}>
            AP: prefer Availability
          </button>
        </div>
        {partition ? (
          <button className="btn" onClick={heal}>
            🔗 Heal network
          </button>
        ) : (
          <button className="btn btn-danger" onClick={() => { setPartition(true); say('✂️ Network partition! A and B can no longer talk.', 'bad'); }}>
            ✂️ Cut the network
          </button>
        )}
      </div>
      <div className="cap-stage">
        <div className="cap-node">
          <div className="cap-name">🖥️ Node A (Mumbai)</div>
          <div className="cap-val">value = {a}</div>
          <button className="btn btn-sm btn-primary" onClick={write}>
            ✍️ Write a new value*
          </button>
        </div>
        <div className={`cap-link ${partition ? 'cut' : ''}`}>
          <span>{partition ? '✂️ partition' : '⇄ replicating'}</span>
        </div>
        <div className="cap-node">
          <div className="cap-name">🖥️ Node B (Frankfurt)</div>
          <div className="cap-val">value = {b}</div>
          <button className="btn btn-sm" onClick={readB}>
            👀 Read value
          </button>
        </div>
      </div>
      <div className="small muted">*Each write just bumps the value by 1, to keep things simple.</div>
      <div className="log" style={{ marginTop: 8 }}>
        {log.length ? (
          log.map((l, i) => (
            <div key={i} style={{ color: l.tone === 'bad' ? 'var(--bad)' : l.tone === 'good' ? 'var(--good)' : l.tone === 'warn' ? 'var(--warn)' : undefined }}>
              {l.t}
            </div>
          ))
        ) : (
          <div className="muted">Write and read with the network working. Then cut it and try both modes.</div>
        )}
      </div>
    </Widget>
  );
}
