import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

type Algo = 'token' | 'leaky' | 'fixed' | 'sliding';

const INFO: Record<Algo, { name: string; desc: string }> = {
  token: { name: 'Token bucket', desc: 'Bucket holds up to 5 tokens, refilled at 1 token/second. Each request spends a token. Allows short bursts, enforces an average rate.' },
  leaky: { name: 'Leaky bucket', desc: 'Requests enter a queue (size 5) that drains at a fixed 1 request/second. Output is perfectly smooth; bursts wait or overflow.' },
  fixed: { name: 'Fixed window counter', desc: 'Max 5 requests per 5-second window (00–05, 05–10…). Simple, but a burst at the end of one window + start of the next lets ~2× through.' },
  sliding: { name: 'Sliding window log', desc: 'Max 5 requests in ANY 5-second period. Remembers timestamps of recent requests. Accurate, uses more memory.' },
};

interface Ev {
  t: number;
  ok: boolean;
}

export default function RateLimiterSim() {
  const [algo, setAlgo] = useState<Algo>('token');
  const [now, setNow] = useState(0); // tenths of a second
  const [events, setEvents] = useState<Ev[]>([]);
  const tokens = useRef(5);
  const lastRefill = useRef(0);
  const queue = useRef<number[]>([]);
  const lastLeak = useRef(0);
  const log = useRef<number[]>([]);
  const windowCount = useRef<{ w: number; c: number }>({ w: 0, c: 0 });
  const nowRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      nowRef.current += 1;
      setNow(nowRef.current);
      // leaky bucket drains 1/s
      if (nowRef.current - lastLeak.current >= 10 && queue.current.length) {
        queue.current.shift();
        lastLeak.current = nowRef.current;
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const reset = (a: Algo) => {
    setAlgo(a);
    tokens.current = 5;
    lastRefill.current = nowRef.current;
    queue.current = [];
    log.current = [];
    windowCount.current = { w: Math.floor(nowRef.current / 50), c: 0 };
    setEvents([]);
  };

  const allow = (): boolean => {
    const t = nowRef.current;
    switch (algo) {
      case 'token': {
        const refill = (t - lastRefill.current) / 10;
        tokens.current = Math.min(5, tokens.current + refill);
        lastRefill.current = t;
        if (tokens.current >= 1) {
          tokens.current -= 1;
          return true;
        }
        return false;
      }
      case 'leaky': {
        if (queue.current.length < 5) {
          if (!queue.current.length) lastLeak.current = t;
          queue.current.push(t);
          return true;
        }
        return false;
      }
      case 'fixed': {
        const w = Math.floor(t / 50);
        if (windowCount.current.w !== w) windowCount.current = { w, c: 0 };
        if (windowCount.current.c < 5) {
          windowCount.current.c++;
          return true;
        }
        return false;
      }
      case 'sliding': {
        log.current = log.current.filter((x) => x > t - 50);
        if (log.current.length < 5) {
          log.current.push(t);
          return true;
        }
        return false;
      }
    }
  };

  const hit = (n = 1) => {
    const out: Ev[] = [];
    for (let i = 0; i < n; i++) out.push({ t: nowRef.current, ok: allow() });
    setEvents((e) => [...e, ...out].filter((x) => x.t > nowRef.current - 150));
  };

  // visual state
  let gauge = 0;
  let gaugeLabel = '';
  if (algo === 'token') {
    const refill = (now - lastRefill.current) / 10;
    gauge = Math.min(5, tokens.current + refill);
    gaugeLabel = `${gauge.toFixed(1)} / 5 tokens`;
  } else if (algo === 'leaky') {
    gauge = queue.current.length;
    gaugeLabel = `${gauge} / 5 queued (draining 1/s)`;
  } else if (algo === 'fixed') {
    const w = Math.floor(now / 50);
    gauge = windowCount.current.w === w ? windowCount.current.c : 0;
    gaugeLabel = `${gauge} / 5 used in window ${w * 5}–${w * 5 + 5}s · resets in ${((50 - (now % 50)) / 10).toFixed(1)}s`;
  } else {
    gauge = log.current.filter((x) => x > now - 50).length;
    gaugeLabel = `${gauge} / 5 in the last 5 s`;
  }
  const fill = algo === 'token' ? gauge / 5 : 1 - gauge / 5;

  const visible = events.filter((e) => e.t > now - 150);
  const okCount = visible.filter((e) => e.ok).length;

  return (
    <Widget title="Try to get past the rate limiter" tag="Simulator">
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(INFO) as Algo[]).map((a) => (
            <button key={a} className={algo === a ? 'on' : ''} onClick={() => reset(a)}>
              {INFO[a].name}
            </button>
          ))}
        </div>
      </div>
      <div className="result-banner info" style={{ marginTop: 0, marginBottom: 10 }}>
        {INFO[algo].desc}
      </div>
      <div className="widget-controls">
        <button className="btn btn-primary" onClick={() => hit(1)}>
          📨 Send 1 request
        </button>
        <button className="btn" onClick={() => hit(8)}>
          💣 Burst of 8
        </button>
        <button className="btn" onClick={() => reset(algo)}>
          ↺ Reset
        </button>
      </div>
      <div className="rl-gauge">
        <div className="small">
          <b>{gaugeLabel}</b>
        </div>
        <div className="meter" style={{ height: 14 }}>
          <div style={{ width: `${fill * 100}%`, background: fill > 0.3 ? 'var(--good)' : fill > 0 ? 'var(--warn)' : 'var(--bad)' }} />
        </div>
      </div>
      <div className="rl-timeline">
        {[0, 5, 10].map((s) => (
          <span key={s} className="rl-tick" style={{ left: `${100 - ((s * 10) / 150) * 100}%` }}>
            {s === 0 ? 'now' : `-${s}s`}
          </span>
        ))}
        {visible.map((e, i) => (
          <span key={i} className={`rl-ev ${e.ok ? 'ok' : 'no'}`} style={{ left: `${100 - ((now - e.t) / 150) * 100}%`, top: 8 + (i % 4) * 14 }} title={e.ok ? '200 OK' : '429 Too Many Requests'} />
        ))}
      </div>
      <div className="small">
        Last 15 s: <b style={{ color: 'var(--good)' }}>{okCount} allowed</b> · <b style={{ color: 'var(--bad)' }}>{visible.length - okCount} rejected (429)</b>
      </div>
    </Widget>
  );
}
