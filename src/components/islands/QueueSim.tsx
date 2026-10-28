import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

interface Msg {
  id: number;
  at: number;
  attempts: number;
}
interface Worker {
  id: number;
  busyUntil: number;
  job: Msg | null;
  alive: boolean;
}

export default function QueueSim() {
  const [rate, setRate] = useState(3); // msgs per second
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, busyUntil: 0, job: null, alive: true },
  ]);
  const [jobTime, setJobTime] = useState(1); // seconds per job
  const [failRate, setFailRate] = useState(0);
  const [queue, setQueue] = useState<Msg[]>([]);
  const [dlq, setDlq] = useState<Msg[]>([]);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0); // in 100 ms ticks
  const [spike, setSpike] = useState(false);
  const next = useRef(1);
  const waits = useRef<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((v) => v + 1), 100);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    // produce
    const r = spike ? rate * 5 : rate;
    const expected = r / 10;
    let n = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
    const newMsgs: Msg[] = [];
    while (n-- > 0) newMsgs.push({ id: next.current++, at: t, attempts: 0 });
    let q = [...queue, ...newMsgs];
    let finished = 0;
    const toDlq: Msg[] = [];
    // consume
    const ws = workers.map((w) => {
      if (!w.alive) return { ...w, job: null };
      let cur = { ...w };
      if (cur.job && cur.busyUntil <= t) {
        if (Math.random() < failRate) {
          const m = { ...cur.job, attempts: cur.job.attempts + 1 };
          if (m.attempts >= 3) toDlq.push(m);
          else q.push(m);
        } else {
          finished++;
        }
        cur.job = null;
      }
      if (!cur.job && q.length) {
        const m = q[0];
        q = q.slice(1);
        waits.current = [...waits.current.slice(-50), t - m.at];
        cur = { ...cur, job: m, busyUntil: t + jobTime * 10 };
      }
      return cur;
    });
    setQueue(q);
    setWorkers(ws);
    if (finished) setDone((d) => d + finished);
    if (toDlq.length) setDlq((d) => [...d, ...toDlq]);
  }, [t]);

  const addWorker = () => setWorkers((ws) => (ws.length >= 8 ? ws : [...ws, { id: ws.length + 1, busyUntil: 0, job: null, alive: true }]));
  const removeWorker = () => setWorkers((ws) => (ws.length <= 1 ? ws : ws.slice(0, -1)));
  const crash = () =>
    setWorkers((ws) => {
      const i = ws.findIndex((w) => w.alive);
      if (i < 0) return ws;
      const w = ws[i];
      // unacknowledged message goes back to the queue
      if (w.job) setQueue((q) => [w.job!, ...q]);
      return ws.map((x, j) => (j === i ? { ...x, alive: false, job: null } : x));
    });
  const reviveAll = () => setWorkers((ws) => ws.map((w) => ({ ...w, alive: true })));
  const reset = () => {
    setQueue([]);
    setDlq([]);
    setDone(0);
    setT(0);
    waits.current = [];
    next.current = 1;
    setWorkers([{ id: 1, busyUntil: 0, job: null, alive: true }]);
  };

  const capacity = workers.filter((w) => w.alive).length / jobTime;
  const incoming = spike ? rate * 5 : rate;
  const avgWait = waits.current.length ? waits.current.reduce((a, b) => a + b, 0) / waits.current.length / 10 : 0;

  return (
    <Widget title="Producers, a queue, and workers" tag="Simulator">
      <div className="widget-controls">
        <button className="btn btn-primary" onClick={() => setRunning(!running)}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <label>
          Incoming: <b>{rate}/s</b>
          <input type="range" min={1} max={12} value={rate} onChange={(e) => setRate(+e.target.value)} />
        </label>
        <label>
          Job takes: <b>{jobTime}s</b>
          <input type="range" min={0.5} max={3} step={0.5} value={jobTime} onChange={(e) => setJobTime(+e.target.value)} />
        </label>
        <label>
          Failure rate: <b>{Math.round(failRate * 100)}%</b>
          <input type="range" min={0} max={0.5} step={0.05} value={failRate} onChange={(e) => setFailRate(+e.target.value)} />
        </label>
      </div>
      <div className="widget-controls">
        <button className="btn btn-sm" onClick={() => setSpike(!spike)}>
          {spike ? '✓ Traffic spike ON (×5)' : '⚡ Traffic spike ×5'}
        </button>
        <button className="btn btn-sm" onClick={addWorker}>
          + worker
        </button>
        <button className="btn btn-sm" onClick={removeWorker}>
          − worker
        </button>
        <button className="btn btn-sm btn-danger" onClick={crash}>
          💥 Crash a worker
        </button>
        <button className="btn btn-sm" onClick={reviveAll}>
          ↺ Revive
        </button>
        <button className="btn btn-sm" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="q-stage">
        <div className="q-producer">
          📤 API servers
          <div className="small muted">{incoming}/s</div>
        </div>
        <div className="q-queue">
          <div className="box-title">📬 Queue ({queue.length})</div>
          <div className="q-msgs">
            {queue.slice(0, 60).map((m) => (
              <span key={`${m.id}-${m.attempts}`} className={`q-msg ${m.attempts ? 'retry' : ''}`} />
            ))}
            {queue.length > 60 && <span className="small muted">+{queue.length - 60}</span>}
          </div>
        </div>
        <div className="q-workers">
          {workers.map((w) => (
            <div key={w.id} className={`q-worker ${!w.alive ? 'dead' : w.job ? 'busy' : ''}`}>
              {!w.alive ? '💀' : w.job ? '⚙️' : '😴'} W{w.id}
            </div>
          ))}
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{incoming}/s</div>
          <div className="l">Incoming</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: capacity >= incoming ? 'var(--good)' : 'var(--bad)' }}>{capacity.toFixed(1)}/s</div>
          <div className="l">Processing capacity</div>
        </div>
        <div className="stat">
          <div className="v">{done}</div>
          <div className="l">Completed</div>
        </div>
        <div className="stat">
          <div className="v">{avgWait.toFixed(1)}s</div>
          <div className="l">Avg wait in queue</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: dlq.length ? 'var(--bad)' : undefined }}>{dlq.length}</div>
          <div className="l">Dead-letter queue</div>
        </div>
      </div>
      <div className={`result-banner ${capacity >= incoming ? 'good' : 'warn'}`}>
        {capacity >= incoming
          ? 'Workers keep up. The queue stays short.'
          : 'Incoming > capacity: the queue grows. Nothing is lost, users just wait longer. Add workers (scale consumers) to drain it.'}
      </div>
    </Widget>
  );
}
