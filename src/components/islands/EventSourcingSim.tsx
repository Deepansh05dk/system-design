import { useState } from 'react';
import Widget from './Widget';

type Ev = { type: 'Deposited' | 'Withdrew' | 'Fee'; amount: number; at: string };

const START: Ev[] = [
  { type: 'Deposited', amount: 5000, at: '09:00' },
  { type: 'Withdrew', amount: 1200, at: '11:30' },
  { type: 'Deposited', amount: 800, at: '14:10' },
  { type: 'Fee', amount: 50, at: '23:59' },
];

export default function EventSourcingSim() {
  const [events, setEvents] = useState<Ev[]>(START);
  const [upTo, setUpTo] = useState(START.length);
  const [clock, setClock] = useState(0);

  const apply = (n: number) => events.slice(0, n).reduce((bal, e) => (e.type === 'Deposited' ? bal + e.amount : bal - e.amount), 0);
  const balance = apply(upTo);
  const deposits = events.slice(0, upTo).filter((e) => e.type === 'Deposited').reduce((s, e) => s + e.amount, 0);
  const add = (type: Ev['type'], amount: number) => {
    const at = `day2 ${String(9 + clock).padStart(2, '0')}:00`;
    setClock((c) => c + 1);
    const next = [...events, { type, amount, at }];
    setEvents(next);
    setUpTo(next.length);
  };

  return (
    <Widget title="A bank account stored as events, not as a balance" tag="Interactive">
      <div className="widget-controls">
        <button className="btn btn-sm btn-primary" onClick={() => add('Deposited', 1000)}>
          + Deposit ₹1000
        </button>
        <button className="btn btn-sm" onClick={() => add('Withdrew', 700)}>
          − Withdraw ₹700
        </button>
        <button className="btn btn-sm" onClick={() => { setEvents(START); setUpTo(START.length); setClock(0); }}>
          ↺ Reset
        </button>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">📜 Event log (append-only, never edited)</div>
          {events.map((e, i) => (
            <div key={i} className={`es-ev ${i < upTo ? '' : 'future'}`}>
              <code>#{i + 1}</code> <span className="muted">{e.at}</span> <b>{e.type}</b> ₹{e.amount}
            </div>
          ))}
          <label className="small" style={{ display: 'block', marginTop: 8 }}>
            ⏪ Time travel: replay first <b>{upTo}</b> events
            <input type="range" min={0} max={events.length} value={upTo} onChange={(e) => setUpTo(+e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div className="box">
          <div className="box-title">Projections (read models built by replaying)</div>
          <div className="stat-row">
            <div className="stat">
              <div className="v">₹{balance}</div>
              <div className="l">Current balance</div>
            </div>
            <div className="stat">
              <div className="v">₹{deposits}</div>
              <div className="l">Total deposited</div>
            </div>
            <div className="stat">
              <div className="v">{events.slice(0, upTo).filter((e) => e.type === 'Fee').length}</div>
              <div className="l">Fees charged</div>
            </div>
          </div>
          <div className="small muted">
            Need a new view next year (“average withdrawal size”)? Write a new projection and replay the log from the start. The history was never thrown away.
          </div>
        </div>
      </div>
    </Widget>
  );
}
