import { useState } from 'react';
import Widget from './Widget';

interface Rep {
  v: number;
  up: boolean;
}

export default function QuorumSim() {
  const N = 3;
  const [W, setW] = useState(2);
  const [R, setR] = useState(2);
  const [reps, setReps] = useState<Rep[]>([
    { v: 1, up: true },
    { v: 1, up: true },
    { v: 1, up: true },
  ]);
  const [latest, setLatest] = useState(1);
  const [readSet, setReadSet] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ t: string; tone: string } | null>(null);

  const write = () => {
    const nv = latest + 1;
    const alive = reps.map((r, i) => (r.up ? i : -1)).filter((i) => i >= 0);
    if (alive.length < W) {
      setMsg({ t: `✗ Write failed: needs ${W} acks but only ${alive.length} replica(s) are up.`, tone: 'bad' });
      return;
    }
    // the write reaches exactly W random live replicas (others miss it for now)
    const chosen = [...alive].sort(() => Math.random() - 0.5).slice(0, W);
    setReps(reps.map((r, i) => (chosen.includes(i) ? { ...r, v: nv } : r)));
    setLatest(nv);
    setReadSet([]);
    setMsg({ t: `✓ Write v${nv} acknowledged by ${W} replica(s): #${chosen.map((c) => c + 1).join(', #')}. The rest are behind.`, tone: 'good' });
  };

  const read = () => {
    const alive = reps.map((r, i) => (r.up ? i : -1)).filter((i) => i >= 0);
    if (alive.length < R) {
      setMsg({ t: `✗ Read failed: needs ${R} replies but only ${alive.length} replica(s) are up.`, tone: 'bad' });
      return;
    }
    const chosen = [...alive].sort(() => Math.random() - 0.5).slice(0, R);
    setReadSet(chosen);
    const best = Math.max(...chosen.map((i) => reps[i].v));
    const fresh = best === latest;
    setMsg({
      t: `Read asked #${chosen.map((c) => c + 1).join(', #')} → newest value seen: v${best}. ${fresh ? '✓ Latest!' : `⚠️ STALE (latest is v${latest})`}`,
      tone: fresh ? 'good' : 'bad',
    });
  };

  const syncAll = () => {
    setReps(reps.map((r) => (r.up ? { ...r, v: latest } : r)));
    setMsg({ t: 'Background repair (anti-entropy / read repair) copied the latest value to all live replicas.', tone: 'good' });
  };

  const overlap = R + W > N;

  return (
    <Widget title="Quorums: N = 3 replicas, pick W and R" tag="Simulator">
      <div className="widget-controls">
        <label>
          W (write acks)
          <select value={W} onChange={(e) => setW(+e.target.value)}>
            {[1, 2, 3].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          R (read replies)
          <select value={R} onChange={(e) => setR(+e.target.value)}>
            {[1, 2, 3].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" onClick={write}>
          ✍️ Write
        </button>
        <button className="btn" onClick={read}>
          👀 Read
        </button>
        <button className="btn" onClick={syncAll}>
          🔄 Repair
        </button>
      </div>
      <div className={`result-banner ${overlap ? 'good' : 'warn'}`} style={{ marginTop: 0, marginBottom: 10 }}>
        R + W = {R + W} {overlap ? '>' : '≤'} N = {N} →{' '}
        {overlap ? 'every read set overlaps every write set, so a read always sees the latest write (strong-ish consistency).' : 'read and write sets may not overlap, so reads can be stale (eventual consistency). Faster and more available though.'}
      </div>
      <div className="q-reps">
        {reps.map((r, i) => (
          <div key={i} className={`q-rep ${!r.up ? 'dead' : ''} ${readSet.includes(i) ? 'asked' : ''}`}>
            <div>
              <b>
                {r.up ? '🗄️' : '💀'} Replica #{i + 1}
              </b>
            </div>
            <div className="rep-val" style={{ color: r.v === latest ? 'var(--good)' : 'var(--warn)' }}>
              v{r.v}
            </div>
            <button className="btn btn-sm" onClick={() => setReps(reps.map((x, j) => (j === i ? { ...x, up: !x.up } : x)))}>
              {r.up ? '💥 Down' : '↺ Up'}
            </button>
          </div>
        ))}
      </div>
      {msg && <div className={`result-banner ${msg.tone}`}>{msg.t}</div>}
      <div className="small muted" style={{ marginTop: 6 }}>
        Try W=1, R=1 and read a few times after a write. Then W=2, R=2. Then take a replica down with W=3.
      </div>
    </Widget>
  );
}
