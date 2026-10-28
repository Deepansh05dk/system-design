import { useState } from 'react';
import Widget from './Widget';

function b64url(s: string) {
  if (typeof btoa === 'undefined') return '';
  return btoa(unescape(encodeURIComponent(s))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// toy "signature": NOT real crypto, just to show that changing the payload changes the signature
function toySign(data: string, secret: string) {
  let h = 2166136261;
  for (const c of data + '|' + secret) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 6; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    out += h.toString(36);
  }
  return out.slice(0, 43);
}

const SECRET = 'server-secret-key';
const HEADER = '{"alg":"HS256","typ":"JWT"}';
const ORIGINAL = '{"sub":"user_7","name":"Asha","role":"user","exp":1767225600}';

export default function JwtDecoder() {
  const [payload, setPayload] = useState(ORIGINAL);
  const originalSig = toySign(b64url(HEADER) + '.' + b64url(ORIGINAL), SECRET);
  const h = b64url(HEADER);
  const p = b64url(payload);
  const valid = toySign(h + '.' + p, SECRET) === originalSig;
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(payload);
  } catch {
    parsed = null;
  }

  return (
    <Widget title="Inside a JWT (try to make yourself an admin)" tag="Playground">
      <div className="jwt-token">
        <span className="jwt-h">{h || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'}</span>.<span className="jwt-p">{p || '…'}</span>.<span className="jwt-s">{originalSig}</span>
      </div>
      <div className="two-col" style={{ marginTop: 10 }}>
        <div>
          <div className="box-title" style={{ color: 'var(--pink)' }}>Header</div>
          <pre style={{ margin: '0 0 8px' }}>{HEADER}</pre>
          <div className="box-title" style={{ color: 'var(--accent-text)' }}>Payload (claims): edit me!</div>
          <textarea className="jwt-edit" value={payload} onChange={(e) => setPayload(e.target.value)} rows={4} spellCheck={false} />
          <div className="widget-controls" style={{ marginTop: 6 }}>
            <button className="btn btn-sm" onClick={() => setPayload(ORIGINAL.replace('"role":"user"', '"role":"admin"'))}>
              😈 Change role to admin
            </button>
            <button className="btn btn-sm" onClick={() => setPayload(ORIGINAL)}>
              ↺ Original
            </button>
          </div>
        </div>
        <div>
          <div className="box-title" style={{ color: 'var(--good)' }}>Signature</div>
          <pre style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>HMACSHA256(base64url(header) + "." + base64url(payload), SECRET)</pre>
          <div className="small">
            The server recomputes the signature using its secret key and compares it with the one in the token.
          </div>
          <div className={`result-banner ${valid ? 'good' : 'bad'}`}>
            {valid
              ? `✓ Signature valid. Server trusts: user ${String(parsed?.sub ?? '?')}, role "${String(parsed?.role ?? '?')}".`
              : '✗ Signature does NOT match. Anyone can read and edit the payload, but without the secret key they can’t produce a valid signature. Request rejected (401).'}
          </div>
          <div className="small muted">
            Note: the payload is only <b>encoded</b>, not encrypted. Anyone holding the token can read it. Never put secrets in a JWT.
          </div>
        </div>
      </div>
    </Widget>
  );
}
