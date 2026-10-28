import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
const THRESHOLD = 5;
const COOLDOWN = 30; // ticks of 100ms = 3 s

export default function CircuitBreakerSim() {
  const [healthy, setHealthy] = useState(true);
  const [useBreaker, setUseBreaker] = useState(true);
  const [state, setState] = useState<State>('CLOSED');
  const [fails, setFails] = useState(0);
  const [openedAt, setOpenedAt] = useState(0);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<{ kind: 'ok' | 'fail' | 'fast' | 'probe-ok' | 'probe-fail'; ms: number }[]>([]);
  const [threadsBusy, setThreadsBusy] = useState(0);
  const ref = useRef({ state, fails, openedAt, healthy, useBreaker });
  ref.current = { state, fails, openedAt, healthy, useBreaker };

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tick % 4 !== 0) return; // a request every 400 ms
    const s = ref.current;
    let st = s.state;
    if (s.useBreaker && st === 'OPEN' && tick - s.openedAt >= COOLDOWN) {
      st = 'HALF_OPEN';
      setState('HALF_OPEN');
    }
    if (s.useBreaker && st === 'OPEN') {
      push({ kind: 'fast', ms: 1 });
      return;
    }
    const ok = s.healthy;
    if (st === 'HALF_OPEN') {
      if (ok) {
        setState('CLOSED');
        setFails(0);
        push({ kind: 'probe-ok', ms: 40 });
      } else {
        setState('OPEN');
        setOpenedAt(tick);
        push({ kind: 'probe-fail', ms: 3000 });
      }
      return;
    }
    if (ok) {
      setFails(0);
      push({ kind: 'ok', ms: 40 });
    } else {
      const f = s.fails + 1;
      setFails(f);
      push({ kind: 'fail', ms: 3000 });
      if (s.useBreaker && f >= THRESHOLD) {
        setState('OPEN');
        setOpenedAt(tick);
      }
    }
  }, [tick]);

  const push = (e: { kind: 'ok' | 'fail' | 'fast' | 'probe-ok' | 'probe-fail'; ms: number }) => {
    setEvents((ev) => [...ev, e].slice(-40));
  };

  useEffect(() => {
    // threads stuck waiting for 3-second timeouts
    const recent = events.slice(-8);
    setThreadsBusy(recent.filter((e) => e.kind === 'fail' || e.kind === 'probe-fail').length);
  }, [events]);

  const reset = () => {
    setState('CLOSED');
    setFails(0);
    setEvents([]);
  };

  const remaining = state === 'OPEN' ? Math.max(0, (COOLDOWN - (tick - openedAt)) / 10) : 0;

  return (
    <Widget title="Order service → Payment service (with a circuit breaker)" tag="Simulator">
      <div className="widget-controls">
        <button className={`btn ${healthy ? 'btn-danger' : 'btn-primary'}`} onClick={() => setHealthy(!healthy)}>
          {healthy ? '💥 Break the payment service' : '🩹 Fix the payment service'}
        </button>
        <label>
          <input type="checkbox" checked={useBreaker} onChange={(e) => { setUseBreaker(e.target.checked); reset(); }} /> Circuit breaker enabled
        </label>
        <button className="btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div className="cb-machine">
        {(['CLOSED', 'OPEN', 'HALF_OPEN'] as State[]).map((s) => (
          <div key={s} className={`cb-state ${s.toLowerCase()} ${useBreaker && state === s ? 'on' : ''}`}>
            <b>{s === 'HALF_OPEN' ? 'HALF-OPEN' : s}</b>
            <div className="small">
              {s === 'CLOSED' && 'Normal. Requests flow. Count failures.'}
              {s === 'OPEN' && `Fail fast, don’t call. Retry in ${remaining.toFixed(1)}s.`}
              {s === 'HALF_OPEN' && 'Let one test request through.'}
            </div>
          </div>
        ))}
      </div>
      <div className="small" style={{ margin: '6px 0' }}>
        Consecutive failures: <b>{fails}</b> / {THRESHOLD} &nbsp;·&nbsp; Payment service: <b style={{ color: healthy ? 'var(--good)' : 'var(--bad)' }}>{healthy ? 'healthy' : 'timing out (3 s)'}</b>
      </div>
      <div className="cb-events">
        {events.map((e, i) => (
          <span key={i} className={`cb-ev ${e.kind}`} title={`${e.kind} · ${e.ms} ms`}>
            {e.kind === 'ok' ? '✓' : e.kind === 'fast' ? '⚡' : e.kind.startsWith('probe') ? '?' : '✗'}
          </span>
        ))}
      </div>
      <div className="small muted">✓ success (40 ms) · ✗ timeout (3 s, a thread is stuck waiting) · ⚡ failed fast by breaker (1 ms) · ? test request</div>
      <div className="stat-row">
        <div className="stat">
          <div className="v" style={{ color: threadsBusy > 4 ? 'var(--bad)' : 'var(--good)' }}>{threadsBusy}</div>
          <div className="l">Threads stuck waiting (last 8 calls)</div>
        </div>
      </div>
      <div className={`result-banner ${!useBreaker && !healthy ? 'bad' : 'info'}`}>
        {!useBreaker && !healthy
          ? 'Without a breaker, every request waits 3 s for a timeout. Threads pile up, and soon the ORDER service runs out of threads too. One sick service takes down its callers: a cascading failure.'
          : 'With a breaker, after 5 failures we stop calling and fail fast (show “payments temporarily unavailable” or queue the order). Every 3 s one test request checks whether the service recovered.'}
      </div>
    </Widget>
  );
}
