import { useState } from 'react';
import Widget from './Widget';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encode(n: bigint): { code: string; steps: { n: string; r: number; ch: string }[] } {
  if (n === 0n) return { code: '0', steps: [{ n: '0', r: 0, ch: '0' }] };
  const steps: { n: string; r: number; ch: string }[] = [];
  let code = '';
  while (n > 0n) {
    const r = Number(n % 62n);
    steps.push({ n: n.toString(), r, ch: ALPHABET[r] });
    code = ALPHABET[r] + code;
    n = n / 62n;
  }
  return { code, steps };
}

export default function Base62Encoder() {
  const [id, setId] = useState('125000000000');
  const [len, setLen] = useState(7);
  let parsed: bigint | null = null;
  try {
    parsed = BigInt(id.trim() || '0');
    if (parsed < 0n) parsed = null;
  } catch {
    parsed = null;
  }
  const res = parsed !== null ? encode(parsed) : null;
  const space = 62 ** len;
  const perYear = 100_000_000 * 12;

  return (
    <Widget title="Turn a numeric ID into a short code (base62)" tag="Playground">
      <div className="widget-controls">
        <label>
          Unique ID
          <input type="text" value={id} onChange={(e) => setId(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: 180, fontFamily: 'var(--mono)' }} />
        </label>
        <button className="btn btn-sm" onClick={() => setId(String(Math.floor(Math.random() * 3.5e12)))}>
          🎲 Random ID
        </button>
      </div>
      {res && (
        <>
          <div className="b62-result">
            <span className="muted">short.ly/</span>
            <b>{res.code}</b>
            <span className="pill" style={{ marginLeft: 8 }}>
              {res.code.length} chars
            </span>
          </div>
          <table className="sim-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>number</th>
                <th>÷ 62 remainder</th>
                <th>character</th>
              </tr>
            </thead>
            <tbody>
              {res.steps.map((s, i) => (
                <tr key={i}>
                  <td>
                    <code>{s.n}</code>
                  </td>
                  <td>{s.r}</td>
                  <td>
                    <b>{s.ch}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small muted">Read the characters bottom-up: that’s the code. 62 symbols = 0–9, a–z, A–Z.</div>
        </>
      )}
      <div className="box" style={{ marginTop: 10 }}>
        <div className="box-title">How long should codes be?</div>
        <label className="small">
          Code length: <b>{len}</b>
          <input type="range" min={4} max={9} value={len} onChange={(e) => setLen(+e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <div className="stat-row">
          <div className="stat">
            <div className="v">{space.toExponential(2)}</div>
            <div className="l">Possible codes (62^{len})</div>
          </div>
          <div className="stat">
            <div className="v">{(space / perYear).toFixed(space / perYear < 10 ? 2 : 0)} yrs</div>
            <div className="l">To use them all at 100M new URLs/month</div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
