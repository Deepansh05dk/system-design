import { useState } from 'react';
import Widget from './Widget';

const METHODS: Record<string, { path: string; body?: string; meaning: string; safe: boolean; idem: boolean }> = {
  GET: { path: '/api/products/42', meaning: 'Read a resource. Never changes data.', safe: true, idem: true },
  POST: { path: '/api/orders', body: '{ "productId": 42, "qty": 1 }', meaning: 'Create something new / trigger an action. Sending twice may create two orders!', safe: false, idem: false },
  PUT: { path: '/api/users/7', body: '{ "name": "Asha", "city": "Pune" }', meaning: 'Replace the whole resource with this version.', safe: false, idem: true },
  PATCH: { path: '/api/users/7', body: '{ "city": "Delhi" }', meaning: 'Update only some fields.', safe: false, idem: false },
  DELETE: { path: '/api/orders/991', meaning: 'Remove a resource. Deleting twice leaves the same end state.', safe: false, idem: true },
};

const STATUSES: { code: number; text: string; meaning: string; when: string; extra?: string }[] = [
  { code: 200, text: 'OK', meaning: 'Success, here is your data.', when: 'Normal GET / successful update.' },
  { code: 201, text: 'Created', meaning: 'A new resource was created.', when: 'After a successful POST.', extra: 'Location: /api/orders/991' },
  { code: 204, text: 'No Content', meaning: 'Success, nothing to send back.', when: 'After DELETE.' },
  { code: 301, text: 'Moved Permanently', meaning: 'This URL moved forever. Browsers & search engines remember it.', when: 'URL shorteners, domain changes.', extra: 'Location: https://new.example.com/page' },
  { code: 302, text: 'Found (temporary redirect)', meaning: 'Go here for now, but ask me again next time.', when: 'URL shorteners that want click analytics.', extra: 'Location: https://example.com/landing' },
  { code: 304, text: 'Not Modified', meaning: 'Your cached copy is still fresh. Use it.', when: 'Browser sent If-None-Match / ETag.' },
  { code: 400, text: 'Bad Request', meaning: 'The request is malformed or invalid.', when: 'Missing field, bad JSON.' },
  { code: 401, text: 'Unauthorized', meaning: 'Who are you? You are not logged in.', when: 'Missing / expired token.' },
  { code: 403, text: 'Forbidden', meaning: 'I know who you are, but you are not allowed.', when: 'Normal user calls an admin API.' },
  { code: 404, text: 'Not Found', meaning: 'Nothing exists at this URL.', when: 'Wrong ID or path.' },
  { code: 409, text: 'Conflict', meaning: 'The request conflicts with current state.', when: 'Seat already booked, version mismatch.' },
  { code: 429, text: 'Too Many Requests', meaning: 'Slow down, you hit a rate limit.', when: 'Rate limiter rejects the client.', extra: 'Retry-After: 30' },
  { code: 500, text: 'Internal Server Error', meaning: 'The server crashed or had a bug.', when: 'Unhandled exception.' },
  { code: 502, text: 'Bad Gateway', meaning: 'A proxy/load balancer got a bad answer from the server behind it.', when: 'App server crashed behind Nginx.' },
  { code: 503, text: 'Service Unavailable', meaning: 'Temporarily overloaded or down for maintenance.', when: 'Overload, deploys.', extra: 'Retry-After: 120' },
  { code: 504, text: 'Gateway Timeout', meaning: 'The server behind the proxy took too long.', when: 'Slow DB query behind a load balancer.' },
];

export default function HttpExplorer() {
  const [method, setMethod] = useState('GET');
  const [code, setCode] = useState(200);
  const m = METHODS[method];
  const st = STATUSES.find((s) => s.code === code)!;
  const family = code < 300 ? 'good' : code < 400 ? 'info' : code < 500 ? 'warn' : 'bad';

  const req = [
    `${method} ${m.path} HTTP/1.1`,
    'Host: shop.example.com',
    'Accept: application/json',
    'Authorization: Bearer eyJhbGciOi…',
    ...(m.body ? ['Content-Type: application/json', `Content-Length: ${m.body.length}`, '', m.body] : []),
  ].join('\n');

  const body = code === 200 ? '{ "id": 42, "name": "Keyboard", "price": 1999 }' : code >= 400 ? `{ "error": "${st.text}" }` : '';
  const res = [
    `HTTP/1.1 ${code} ${st.text}`,
    'Date: Wed, 28 Oct 2026 10:00:00 GMT',
    ...(st.extra ? [st.extra] : []),
    ...(code === 200 ? ['Cache-Control: max-age=60', 'ETag: "a1b2c3"'] : []),
    ...(body ? ['Content-Type: application/json', '', body] : []),
  ].join('\n');

  return (
    <Widget title="Build an HTTP request, pick a response" tag="Explorer">
      <div className="two-col">
        <div>
          <div className="box-title">1 · Request method</div>
          <div className="seg" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            {Object.keys(METHODS).map((k) => (
              <button key={k} className={k === method ? 'on' : ''} onClick={() => setMethod(k)}>
                {k}
              </button>
            ))}
          </div>
          <pre className="http-raw">{req}</pre>
          <div className="small">
            <b>{method}:</b> {m.meaning}
            <div style={{ marginTop: 4 }}>
              <span className={`pill ${m.safe ? 'pill-good' : 'pill-warn'}`}>{m.safe ? 'safe' : 'changes data'}</span>{' '}
              <span className={`pill ${m.idem ? 'pill-good' : 'pill-bad'}`}>{m.idem ? 'idempotent' : 'not idempotent'}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="box-title">2 · Response status</div>
          <select value={code} onChange={(e) => setCode(+e.target.value)} style={{ marginBottom: 8, width: '100%' }}>
            {STATUSES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} {s.text}
              </option>
            ))}
          </select>
          <pre className="http-raw">{res}</pre>
          <div className={`result-banner ${family}`} style={{ marginTop: 0 }}>
            <b>
              {code} = {st.meaning}
            </b>
            <div className="small">Typical case: {st.when}</div>
          </div>
        </div>
      </div>
      <div className="http-families small">
        <span><b>2xx</b> success</span>
        <span><b>3xx</b> go somewhere else / use cache</span>
        <span><b>4xx</b> client’s fault</span>
        <span><b>5xx</b> server’s fault</span>
      </div>
    </Widget>
  );
}
