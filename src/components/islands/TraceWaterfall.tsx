import { useState } from 'react';
import Widget from './Widget';

interface Span {
  name: string;
  service: string;
  start: number;
  dur: number;
  depth: number;
  note: string;
}

const SPANS: Span[] = [
  { name: 'GET /checkout', service: 'api-gateway', start: 0, dur: 1240, depth: 0, note: 'The whole request as the user experienced it.' },
  { name: 'verify token', service: 'auth', start: 5, dur: 12, depth: 1, note: 'Fast. Not the problem.' },
  { name: 'getCart', service: 'cart-service', start: 20, dur: 60, depth: 1, note: 'Fine.' },
  { name: 'redis GET cart:7', service: 'cart-service', start: 25, dur: 3, depth: 2, note: 'Cache hit.' },
  { name: 'getPrices (×12 items)', service: 'pricing', start: 85, dur: 960, depth: 1, note: '⚠️ 12 sequential calls instead of one batch call → the N+1 problem across services. Fix: one batch endpoint, or call in parallel.' },
  { name: 'SELECT price … (item 1)', service: 'pricing-db', start: 90, dur: 75, depth: 2, note: 'Each query ~75 ms because the products table has no index on sku. Fix: add the index.' },
  { name: 'SELECT price … (item 2)', service: 'pricing-db', start: 170, dur: 78, depth: 2, note: 'Same slow query, again…' },
  { name: '… 10 more identical queries', service: 'pricing-db', start: 250, dur: 790, depth: 2, note: 'Same pattern 10 more times.' },
  { name: 'calculateTax', service: 'tax', start: 1050, dur: 40, depth: 1, note: 'Fine.' },
  { name: 'render response', service: 'api-gateway', start: 1095, dur: 140, depth: 1, note: 'Serializing a large JSON payload. Could trim fields.' },
];

const COLORS: Record<string, string> = {
  'api-gateway': 'var(--k-lb)',
  auth: 'var(--k-service)',
  'cart-service': 'var(--k-client)',
  pricing: 'var(--k-worker)',
  'pricing-db': 'var(--k-db)',
  tax: 'var(--k-queue)',
};

export default function TraceWaterfall() {
  const [sel, setSel] = useState(4);
  const total = SPANS[0].dur;

  return (
    <Widget title="A distributed trace: why did checkout take 1.24 s?" tag="Explore">
      <div className="small muted" style={{ marginBottom: 8 }}>
        Click a bar. Each bar is a <b>span</b> (one operation); indentation shows which call made which.
      </div>
      <div className="tw-list">
        {SPANS.map((s, i) => (
          <button key={i} className={`tw-row ${sel === i ? 'on' : ''}`} onClick={() => setSel(i)}>
            <span className="tw-name" style={{ paddingLeft: s.depth * 14 }}>
              {s.name}
              <small className="muted"> · {s.service}</small>
            </span>
            <span className="tw-track">
              <span className="tw-bar" style={{ left: `${(s.start / total) * 100}%`, width: `${Math.max(0.6, (s.dur / total) * 100)}%`, background: COLORS[s.service] }} />
            </span>
            <span className="tw-ms">{s.dur} ms</span>
          </button>
        ))}
      </div>
      <div className={`result-banner ${SPANS[sel].note.startsWith('⚠️') ? 'warn' : 'info'}`}>
        <b>{SPANS[sel].name}</b> ({SPANS[sel].service}, {SPANS[sel].dur} ms): {SPANS[sel].note}
      </div>
    </Widget>
  );
}
