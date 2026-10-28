import { useState } from 'react';
import Widget from './Widget';

interface Inputs {
  dau: number;
  writesPerUser: number;
  readRatio: number;
  objectKB: number;
  years: number;
  peak: number;
  replicas: number;
}

const PRESETS: Record<string, Inputs & { label: string }> = {
  twitter: { label: 'Twitter-like', dau: 200_000_000, writesPerUser: 2, readRatio: 50, objectKB: 1, years: 5, peak: 3, replicas: 3 },
  shortener: { label: 'URL shortener', dau: 10_000_000, writesPerUser: 0.1, readRatio: 100, objectKB: 0.5, years: 10, peak: 3, replicas: 3 },
  chat: { label: 'Chat app', dau: 50_000_000, writesPerUser: 40, readRatio: 1, objectKB: 0.2, years: 5, peak: 2, replicas: 3 },
  photos: { label: 'Photo sharing', dau: 100_000_000, writesPerUser: 0.2, readRatio: 50, objectKB: 500, years: 5, peak: 3, replicas: 3 },
};

const SECONDS_PER_DAY = 86_400;

function num(n: number) {
  if (n >= 1e12) return `${+(n / 1e12).toFixed(1)} T`;
  if (n >= 1e9) return `${+(n / 1e9).toFixed(1)} B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)} M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)} K`;
  return `${+n.toFixed(1)}`;
}

function bytes(kb: number) {
  const b = kb * 1000;
  if (b >= 1e15) return `${+(b / 1e15).toFixed(1)} PB`;
  if (b >= 1e12) return `${+(b / 1e12).toFixed(1)} TB`;
  if (b >= 1e9) return `${+(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${+(b / 1e6).toFixed(1)} MB`;
  return `${+(b / 1e3).toFixed(1)} KB`;
}

function Field({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (v: number) => void; step?: number; hint?: string }) {
  return (
    <label className="est-field">
      <span>{label}</span>
      <input type="number" value={value} step={step} min={0} onChange={(e) => onChange(Math.max(0, +e.target.value))} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export default function EstimationCalc() {
  const [v, setV] = useState<Inputs>(PRESETS.twitter);
  const set = (k: keyof Inputs) => (n: number) => setV({ ...v, [k]: n });

  const writesPerDay = v.dau * v.writesPerUser;
  const writeQps = writesPerDay / SECONDS_PER_DAY;
  const readQps = writeQps * v.readRatio;
  const peakQps = (writeQps + readQps) * v.peak;
  const storagePerDayKB = writesPerDay * v.objectKB;
  const totalKB = storagePerDayKB * 365 * v.years * v.replicas;
  const ingressKBs = writeQps * v.objectKB;
  const egressKBs = readQps * v.objectKB;
  const servers = Math.ceil(peakQps / 1000);

  return (
    <Widget title="Back-of-the-envelope calculator" tag="Calculator">
      <div className="widget-controls">
        <span className="small muted">Presets:</span>
        {Object.entries(PRESETS).map(([k, p]) => (
          <button key={k} className="btn btn-sm" onClick={() => setV(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="est-grid">
        <Field label="Daily active users" value={v.dau} onChange={set('dau')} step={1_000_000} hint={num(v.dau)} />
        <Field label="Writes per user / day" value={v.writesPerUser} onChange={set('writesPerUser')} step={0.1} hint="posts, messages, uploads…" />
        <Field label="Reads per write" value={v.readRatio} onChange={set('readRatio')} hint="read:write ratio" />
        <Field label="Avg size of one write (KB)" value={v.objectKB} onChange={set('objectKB')} step={0.1} />
        <Field label="Keep data for (years)" value={v.years} onChange={set('years')} />
        <Field label="Peak multiplier" value={v.peak} onChange={set('peak')} step={0.5} hint="peak ÷ average traffic" />
        <Field label="Replication factor" value={v.replicas} onChange={set('replicas')} hint="copies of each byte" />
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{num(writeQps)}</div>
          <div className="l">Write QPS (avg)</div>
        </div>
        <div className="stat">
          <div className="v">{num(readQps)}</div>
          <div className="l">Read QPS (avg)</div>
        </div>
        <div className="stat">
          <div className="v">{num(peakQps)}</div>
          <div className="l">Peak total QPS</div>
        </div>
        <div className="stat">
          <div className="v">{bytes(storagePerDayKB)}</div>
          <div className="l">New data / day</div>
        </div>
        <div className="stat">
          <div className="v">{bytes(totalKB)}</div>
          <div className="l">Total storage</div>
        </div>
        <div className="stat">
          <div className="v">{bytes(egressKBs)}/s</div>
          <div className="l">Outgoing bandwidth</div>
        </div>
      </div>
      <div className="est-work">
        <div className="box-title">Show your work (say this out loud in an interview)</div>
        <ol>
          <li>
            Writes/day = {num(v.dau)} users × {v.writesPerUser} = <b>{num(writesPerDay)}</b>
          </li>
          <li>
            Write QPS = {num(writesPerDay)} ÷ 86,400 s ≈ {num(writesPerDay)} ÷ 100K ≈ <b>{num(writeQps)}</b>
          </li>
          <li>
            Read QPS = {num(writeQps)} × {v.readRatio} = <b>{num(readQps)}</b> &nbsp;→ peak ×{v.peak} ≈ <b>{num(peakQps)}</b>
          </li>
          <li>
            Storage = {num(writesPerDay)} × {v.objectKB} KB = {bytes(storagePerDayKB)}/day → × 365 × {v.years} yrs × {v.replicas} copies ≈{' '}
            <b>{bytes(totalKB)}</b>
          </li>
          <li>
            Bandwidth in ≈ {bytes(ingressKBs)}/s, out ≈ <b>{bytes(egressKBs)}/s</b>
          </li>
          <li>
            If one app server handles ~1,000 QPS → roughly <b>{servers.toLocaleString()}</b> servers at peak (before caching).
          </li>
        </ol>
      </div>
    </Widget>
  );
}
