import { useState } from 'react';
import Widget from './Widget';

const EPOCH = 1288834974657n; // Twitter's custom epoch (Nov 2010)

export default function SnowflakeGen() {
  const [dc, setDc] = useState(3);
  const [worker, setWorker] = useState(12);
  const [ids, setIds] = useState<{ ts: bigint; dc: number; w: number; seq: number; id: bigint }[]>([]);
  const [last, setLast] = useState<{ ms: bigint; seq: number }>({ ms: 0n, seq: 0 });

  const gen = (n = 1) => {
    let { ms, seq } = last;
    const out: typeof ids = [];
    for (let i = 0; i < n; i++) {
      const now = BigInt(Date.now());
      if (now === ms) seq = (seq + 1) & 4095;
      else {
        ms = now;
        seq = 0;
      }
      const ts = ms - EPOCH;
      const id = (ts << 22n) | (BigInt(dc) << 17n) | (BigInt(worker) << 12n) | BigInt(seq);
      out.push({ ts, dc, w: worker, seq, id });
    }
    setLast({ ms, seq });
    setIds((x) => [...out.reverse(), ...x].slice(0, 6));
  };

  const top = ids[0];
  const bits = top ? top.id.toString(2).padStart(64, '0') : '0'.repeat(64);
  const parts = [
    { name: 'sign', len: 1, color: 'var(--text-faint)' },
    { name: 'timestamp (ms since epoch)', len: 41, color: 'var(--k-client)' },
    { name: 'datacenter', len: 5, color: 'var(--k-queue)' },
    { name: 'machine', len: 5, color: 'var(--k-worker)' },
    { name: 'sequence', len: 12, color: 'var(--k-lb)' },
  ];
  let offset = 0;

  return (
    <Widget title="Generate Snowflake IDs" tag="Playground">
      <div className="widget-controls">
        <label>
          Datacenter ID
          <input type="number" min={0} max={31} value={dc} onChange={(e) => setDc(Math.max(0, Math.min(31, +e.target.value)))} style={{ width: 64 }} />
        </label>
        <label>
          Machine ID
          <input type="number" min={0} max={31} value={worker} onChange={(e) => setWorker(Math.max(0, Math.min(31, +e.target.value)))} style={{ width: 64 }} />
        </label>
        <button className="btn btn-primary" onClick={() => gen(1)}>
          ⚡ Generate ID
        </button>
        <button className="btn" onClick={() => gen(5)}>
          ⚡ ×5 in the same millisecond
        </button>
      </div>
      <div className="sf-bits">
        {parts.map((p) => {
          const seg = bits.slice(offset, offset + p.len);
          offset += p.len;
          return (
            <div key={p.name} className="sf-part" style={{ flex: p.len, borderColor: p.color }}>
              <code style={{ color: p.color }}>{seg}</code>
              <span className="small">
                {p.name} · {p.len} bit{p.len > 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
      {ids.length > 0 && (
        <table className="sim-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>ID (64-bit number)</th>
              <th>timestamp</th>
              <th>dc</th>
              <th>machine</th>
              <th>seq</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((x, i) => (
              <tr key={i} className={i === 0 ? 'hl' : ''}>
                <td>
                  <code>{x.id.toString()}</code>
                </td>
                <td>{new Date(Number(x.ts + EPOCH)).toISOString().slice(11, 23)}</td>
                <td>{x.dc}</td>
                <td>{x.w}</td>
                <td>{x.seq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="result-banner info">
        IDs created later are bigger (sorted by time), each machine generates IDs on its own with no coordination, and up to
        4,096 IDs per millisecond per machine are possible (12-bit sequence). 41 bits of milliseconds last ~69 years.
      </div>
    </Widget>
  );
}
