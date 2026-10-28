import { useState } from 'react';
import Widget from './Widget';

type Mode = 'none' | 'pessimistic' | 'optimistic' | 'atomic';

interface Step {
  who: 'Asha' | 'Ravi' | 'DB';
  text: string;
  tone?: 'good' | 'bad' | 'warn';
}

const SCRIPTS: Record<Mode, { title: string; steps: Step[]; result: string; ok: boolean }> = {
  none: {
    title: 'No protection (read, check, write)',
    steps: [
      { who: 'Asha', text: 'SELECT status FROM seats WHERE id = 12A  → "available"' },
      { who: 'Ravi', text: 'SELECT status FROM seats WHERE id = 12A  → "available"' },
      { who: 'Asha', text: 'Looks free! UPDATE seats SET status="booked", user="Asha" WHERE id = 12A' },
      { who: 'Ravi', text: 'Looks free! UPDATE seats SET status="booked", user="Ravi" WHERE id = 12A', tone: 'bad' },
      { who: 'DB', text: 'Both succeeded. Seat 12A belongs to Ravi, but Asha also got a confirmation email. 😱', tone: 'bad' },
    ],
    result: 'Double booking! Both users read “available” before either wrote. Classic check-then-act race condition.',
    ok: false,
  },
  pessimistic: {
    title: 'Pessimistic lock (SELECT … FOR UPDATE)',
    steps: [
      { who: 'Asha', text: 'BEGIN; SELECT * FROM seats WHERE id = 12A FOR UPDATE  → "available" 🔒 row locked' },
      { who: 'Ravi', text: 'BEGIN; SELECT * FROM seats WHERE id = 12A FOR UPDATE  → ⏳ blocked, waiting for the lock…', tone: 'warn' },
      { who: 'Asha', text: 'UPDATE seats SET status="booked", user="Asha"; COMMIT;  🔓 lock released', tone: 'good' },
      { who: 'Ravi', text: '…lock acquired → sees "booked". Shows “Sorry, seat taken”. ROLLBACK;', tone: 'good' },
      { who: 'DB', text: 'Exactly one booking.', tone: 'good' },
    ],
    result: 'Correct. Cost: Ravi waited. Under heavy contention, many requests queue on hot rows; locks held too long can cause slowdowns or deadlocks.',
    ok: true,
  },
  optimistic: {
    title: 'Optimistic locking (version column)',
    steps: [
      { who: 'Asha', text: 'SELECT status, version FROM seats WHERE id = 12A  → "available", version 7' },
      { who: 'Ravi', text: 'SELECT status, version FROM seats WHERE id = 12A  → "available", version 7' },
      { who: 'Asha', text: 'UPDATE seats SET status="booked", user="Asha", version=8 WHERE id=12A AND version=7  → 1 row updated ✓', tone: 'good' },
      { who: 'Ravi', text: 'UPDATE seats SET status="booked", user="Ravi", version=8 WHERE id=12A AND version=7  → 0 rows updated ✗', tone: 'warn' },
      { who: 'Ravi', text: '0 rows means someone changed it first → re-read → "booked" → “Sorry, seat taken”.', tone: 'good' },
    ],
    result: 'Correct, with no waiting and no locks. Great when conflicts are rare. When conflicts are frequent, many requests fail and retry.',
    ok: true,
  },
  atomic: {
    title: 'Atomic conditional update',
    steps: [
      { who: 'Asha', text: 'UPDATE seats SET status="booked", user="Asha" WHERE id=12A AND status="available"  → 1 row ✓', tone: 'good' },
      { who: 'Ravi', text: 'UPDATE seats SET status="booked", user="Ravi" WHERE id=12A AND status="available"  → 0 rows ✗', tone: 'warn' },
      { who: 'DB', text: 'The database runs each UPDATE atomically, so the check and the write can’t be split.', tone: 'good' },
    ],
    result: 'Correct and simplest. Works whenever the whole decision fits into one statement on one row.',
    ok: true,
  },
};

export default function LockingSim() {
  const [mode, setMode] = useState<Mode>('none');
  const [shown, setShown] = useState(0);
  const s = SCRIPTS[mode];

  return (
    <Widget title="Two users click “Book seat 12A” at the same instant" tag="Step-through">
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(SCRIPTS) as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setShown(0); }}>
              {SCRIPTS[m].title.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        {s.title}
      </div>
      <div className="lock-lanes">
        <div className="lock-head">👩 Asha</div>
        <div className="lock-head">🗄️ Database</div>
        <div className="lock-head">👨 Ravi</div>
        {s.steps.slice(0, shown).map((st, i) => (
          <div key={i} className={`lock-step fade-in col-${st.who} ${st.tone ?? ''}`}>
            {st.text}
          </div>
        ))}
      </div>
      <div className="widget-controls" style={{ marginTop: 10 }}>
        <button className="btn btn-primary" onClick={() => setShown(Math.min(s.steps.length, shown + 1))} disabled={shown === s.steps.length}>
          ▶ Next step
        </button>
        <button className="btn" onClick={() => setShown(s.steps.length)}>
          Show all
        </button>
        <button className="btn" onClick={() => setShown(0)}>
          ↺ Restart
        </button>
      </div>
      {shown === s.steps.length && <div className={`result-banner ${s.ok ? 'good' : 'bad'}`}>{s.result}</div>}
    </Widget>
  );
}
