import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

type Mode = 'poll' | 'long' | 'sse' | 'ws';

const INFO: Record<Mode, { name: string; desc: string }> = {
  poll: { name: 'Short polling', desc: 'Client asks “anything new?” every 3 s. Simple, but most answers are “no”, and news waits up to 3 s.' },
  long: { name: 'Long polling', desc: 'Client asks, and the server HOLDS the request open until there’s news (or 20 s pass). Then the client immediately asks again.' },
  sse: { name: 'Server-Sent Events', desc: 'One long-lived HTTP response; the server streams events down whenever they happen. One-way: server → client.' },
  ws: { name: 'WebSocket', desc: 'One persistent, two-way connection. Either side can send a message at any time, with tiny overhead per message.' },
};

interface Ev {
  t: number;
  kind: 'req' | 'empty' | 'msg' | 'up' | 'open';
  delay?: number;
}

const DURATION = 300; // ticks of 100 ms = 30 s

export default function RealtimeSim() {
  const [mode, setMode] = useState<Mode>('poll');
  const [t, setT] = useState(0);
  const [events, setEvents] = useState<Ev[]>([]);
  const [running, setRunning] = useState(false);
  const pending = useRef<number[]>([]); // times of messages waiting on the server
  const lastPoll = useRef(0);
  const longOpenSince = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    if (t >= DURATION) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setT((x) => x + 1), 30);
    return () => clearTimeout(id);
  }, [running, t]);

  useEffect(() => {
    if (!running) return;
    const add: Ev[] = [];
    // server-side news arrives at random moments (~ every 4 s)
    if (t > 0 && (t % 37 === 0 || t % 53 === 0)) pending.current.push(t);
    if (mode === 'poll') {
      if (t - lastPoll.current >= 30 || t === 1) {
        lastPoll.current = t;
        add.push({ t, kind: 'req' });
        if (pending.current.length) {
          pending.current.forEach((p) => add.push({ t, kind: 'msg', delay: t - p }));
          pending.current = [];
        } else add.push({ t, kind: 'empty' });
      }
    } else if (mode === 'long') {
      if (longOpenSince.current === null) {
        longOpenSince.current = t;
        add.push({ t, kind: 'req' });
      }
      if (pending.current.length) {
        pending.current.forEach((p) => add.push({ t: t + 1, kind: 'msg', delay: t + 1 - p }));
        pending.current = [];
        longOpenSince.current = null;
      } else if (t - (longOpenSince.current ?? t) >= 200) {
        add.push({ t, kind: 'empty' });
        longOpenSince.current = null;
      }
    } else {
      if (t === 1) add.push({ t, kind: 'open' });
      if (pending.current.length) {
        pending.current.forEach((p) => add.push({ t: t + 1, kind: 'msg', delay: 1 }));
        pending.current = [];
      }
      if (mode === 'ws' && t % 70 === 0) add.push({ t, kind: 'up' });
    }
    if (add.length) setEvents((e) => [...e, ...add]);
  }, [t]);

  const start = (m: Mode) => {
    setMode(m);
    setEvents([]);
    pending.current = [];
    lastPoll.current = 0;
    longOpenSince.current = null;
    setT(0);
    setRunning(true);
  };

  const requests = events.filter((e) => e.kind === 'req' || e.kind === 'open').length;
  const empties = events.filter((e) => e.kind === 'empty').length;
  const msgs = events.filter((e) => e.kind === 'msg');
  const avgDelay = msgs.length ? msgs.reduce((s, m) => s + (m.delay ?? 0), 0) / msgs.length / 10 : 0;
  const connected = mode === 'sse' || mode === 'ws';

  return (
    <Widget title="30 seconds of a live chat, four ways" tag="Simulator">
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(INFO) as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => start(m)}>
              {INFO[m].name}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => start(mode)}>
          ▶ {t === 0 ? 'Run' : 'Run again'}
        </button>
      </div>
      <div className="result-banner info" style={{ marginTop: 0, marginBottom: 10 }}>
        {INFO[mode].desc}
      </div>
      <div className="rt-lanes">
        <div className="rt-label">💻 Client</div>
        <div className="rt-track">
          {connected && t > 0 && <div className="rt-conn" style={{ width: `${(t / DURATION) * 100}%` }} />}
          {mode === 'long' && longOpenSince.current !== null && (
            <div className="rt-hold" style={{ left: `${(longOpenSince.current / DURATION) * 100}%`, width: `${((t - longOpenSince.current) / DURATION) * 100}%` }} />
          )}
          {events.map((e, i) => (
            <span key={i} className={`rt-ev ${e.kind}`} style={{ left: `${(e.t / DURATION) * 100}%` }} title={e.kind}>
              {e.kind === 'req' ? '↑' : e.kind === 'empty' ? '∅' : e.kind === 'msg' ? '✉' : e.kind === 'up' ? '↑✉' : '⇅'}
            </span>
          ))}
          <div className="rt-now" style={{ left: `${(t / DURATION) * 100}%` }} />
        </div>
        <div className="rt-label">🖥️ Server</div>
      </div>
      <div className="small muted" style={{ marginTop: 4 }}>
        ↑ request · ∅ empty response (“nothing new”) · ✉ message delivered · ⇅ connection opened · ↑✉ client sends a message (WebSocket only)
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{requests}</div>
          <div className="l">Requests / connections opened</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: empties > 3 ? 'var(--bad)' : undefined }}>{empties}</div>
          <div className="l">Wasted empty responses</div>
        </div>
        <div className="stat">
          <div className="v">{msgs.length}</div>
          <div className="l">Messages received</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: avgDelay > 1 ? 'var(--warn)' : 'var(--good)' }}>{avgDelay.toFixed(1)} s</div>
          <div className="l">Avg delay to see a message</div>
        </div>
      </div>
    </Widget>
  );
}
