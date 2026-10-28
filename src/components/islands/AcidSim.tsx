import { useState } from 'react';
import Widget from './Widget';

type Log = { text: string; tone?: 'good' | 'bad' | 'warn' };

function Atomicity() {
  const [useTx, setUseTx] = useState(false);
  const [crash, setCrash] = useState(true);
  const [a, setA] = useState(1000);
  const [b, setB] = useState(500);
  const [log, setLog] = useState<Log[]>([]);

  const run = () => {
    const L: Log[] = [];
    let A = 1000;
    let B = 500;
    if (useTx) L.push({ text: 'BEGIN TRANSACTION;' });
    L.push({ text: 'UPDATE accounts SET balance = balance - 200 WHERE name = "A";  -- A: 1000 → 800' });
    A -= 200;
    if (crash) {
      L.push({ text: '💥 Server crashed / power cut!', tone: 'bad' });
      if (useTx) {
        L.push({ text: 'On restart: transaction never committed → ROLLBACK. A goes back to 1000.', tone: 'good' });
        A = 1000;
      } else {
        L.push({ text: 'On restart: first update already saved, second never ran.', tone: 'bad' });
      }
    } else {
      L.push({ text: 'UPDATE accounts SET balance = balance + 200 WHERE name = "B";  -- B: 500 → 700' });
      B += 200;
      if (useTx) L.push({ text: 'COMMIT;  -- both changes saved together', tone: 'good' });
    }
    setA(A);
    setB(B);
    setLog(L);
  };

  const total = a + b;
  return (
    <div>
      <div className="widget-controls">
        <label>
          <input type="checkbox" checked={useTx} onChange={(e) => setUseTx(e.target.checked)} /> Wrap in a transaction
        </label>
        <label>
          <input type="checkbox" checked={crash} onChange={(e) => setCrash(e.target.checked)} /> Crash between the two updates
        </label>
        <button className="btn btn-primary" onClick={run}>
          ▶ Transfer ₹200 from A to B
        </button>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">₹{a}</div>
          <div className="l">Account A</div>
        </div>
        <div className="stat">
          <div className="v">₹{b}</div>
          <div className="l">Account B</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: total === 1500 ? 'var(--good)' : 'var(--bad)' }}>₹{total}</div>
          <div className="l">Total (should be 1500)</div>
        </div>
      </div>
      {log.length > 0 && (
        <div className="log">
          {log.map((l, i) => (
            <div key={i} style={{ color: l.tone === 'bad' ? 'var(--bad)' : l.tone === 'good' ? 'var(--good)' : undefined }}>
              {l.text}
            </div>
          ))}
        </div>
      )}
      {log.length > 0 && (
        <div className={`result-banner ${total === 1500 ? 'good' : 'bad'}`}>
          {total === 1500 ? '✓ Money is consistent. Atomicity: all or nothing.' : '✗ ₹200 vanished! Without a transaction, half an operation was saved.'}
        </div>
      )}
    </div>
  );
}

function Isolation() {
  const [locking, setLocking] = useState(false);
  const [log, setLog] = useState<Log[]>([]);
  const [bal, setBal] = useState(1000);

  const run = () => {
    const L: Log[] = [];
    if (!locking) {
      L.push({ text: 'T1 (phone):  read balance → 1000' });
      L.push({ text: 'T2 (laptop): read balance → 1000' });
      L.push({ text: 'T1: 1000 ≥ 800? yes → write balance = 200, give ₹800' });
      L.push({ text: 'T2: 1000 ≥ 800? yes → write balance = 200, give ₹800', tone: 'bad' });
      L.push({ text: 'Result: ₹1600 withdrawn from an account that had ₹1000. Balance shows 200!', tone: 'bad' });
      setBal(200);
    } else {
      L.push({ text: 'T1 (phone):  SELECT … FOR UPDATE → 1000 (row locked 🔒)' });
      L.push({ text: 'T2 (laptop): SELECT … FOR UPDATE → waits for the lock ⏳', tone: 'warn' });
      L.push({ text: 'T1: 1000 ≥ 800 → balance = 200, COMMIT (lock released 🔓)' });
      L.push({ text: 'T2: now reads 200. 200 ≥ 800? no → “Insufficient funds”', tone: 'good' });
      L.push({ text: 'Result: only one ₹800 withdrawal. Correct!', tone: 'good' });
      setBal(200);
    }
    setLog(L);
  };

  return (
    <div>
      <p className="small" style={{ marginTop: 0 }}>
        Two withdrawals of ₹800 happen at the <b>same moment</b> from an account with ₹1000 (phone + laptop).
      </p>
      <div className="widget-controls">
        <label>
          <input type="checkbox" checked={locking} onChange={(e) => setLocking(e.target.checked)} /> Use proper isolation (lock the row)
        </label>
        <button className="btn btn-primary" onClick={run}>
          ▶ Run both withdrawals
        </button>
      </div>
      {log.length > 0 && (
        <>
          <div className="log">
            {log.map((l, i) => (
              <div key={i} style={{ color: l.tone === 'bad' ? 'var(--bad)' : l.tone === 'good' ? 'var(--good)' : l.tone === 'warn' ? 'var(--warn)' : undefined }}>
                {l.text}
              </div>
            ))}
          </div>
          <div className={`result-banner ${locking ? 'good' : 'bad'}`}>
            Final balance ₹{bal}. {locking ? 'Isolation prevented the race.' : 'This is a “lost update” race condition. The bank lost ₹800.'}
          </div>
        </>
      )}
    </div>
  );
}

export default function AcidSim() {
  const [tab, setTab] = useState<'a' | 'i'>('a');
  return (
    <Widget title="Break a bank, then fix it with ACID" tag="Simulator">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === 'a' ? 'on' : ''} onClick={() => setTab('a')}>
          Atomicity: crash mid-transfer
        </button>
        <button className={tab === 'i' ? 'on' : ''} onClick={() => setTab('i')}>
          Isolation: two withdrawals at once
        </button>
      </div>
      {tab === 'a' ? <Atomicity /> : <Isolation />}
    </Widget>
  );
}
