import { useState } from 'react';
import Widget from './Widget';

const CITIES = [
  { name: 'Mumbai', rtt: 220, edge: 12 },
  { name: 'London', rtt: 80, edge: 10 },
  { name: 'São Paulo', rtt: 130, edge: 15 },
  { name: 'Sydney', rtt: 210, edge: 14 },
  { name: 'New York', rtt: 15, edge: 6 },
];
// origin is in Virginia (US East). rtt = round trip from city to origin.
const FILE_KB = 400;

export default function CdnSim() {
  const [useCdn, setUseCdn] = useState(true);
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<{ city: string; ms: number; note: string; tone: string }[]>([]);
  const [originHits, setOriginHits] = useState(0);

  const request = (city: (typeof CITIES)[number]) => {
    // simple model: handshake + request ≈ 3 RTT for a fresh HTTPS connection, plus transfer
    const transfer = 30;
    let ms: number;
    let note: string;
    let tone: string;
    if (!useCdn) {
      ms = city.rtt * 3 + transfer;
      note = 'Direct to origin in Virginia';
      tone = city.rtt > 100 ? 'bad' : 'warn';
      setOriginHits((o) => o + 1);
    } else if (cached[city.name]) {
      ms = city.edge * 3 + transfer;
      note = `Edge HIT in ${city.name}`;
      tone = 'good';
    } else {
      ms = city.edge * 3 + city.rtt + transfer;
      note = `Edge MISS → fetched from origin, now cached in ${city.name}`;
      tone = 'warn';
      setCached((c) => ({ ...c, [city.name]: true }));
      setOriginHits((o) => o + 1);
    }
    setResults((r) => [{ city: city.name, ms, note, tone }, ...r].slice(0, 8));
  };

  const max = 800;
  return (
    <Widget title={`Load a ${FILE_KB} KB image from around the world`} tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={!useCdn ? 'on' : ''} onClick={() => { setUseCdn(false); setResults([]); }}>
            No CDN
          </button>
          <button className={useCdn ? 'on' : ''} onClick={() => { setUseCdn(true); setResults([]); setCached({}); }}>
            With CDN
          </button>
        </div>
        <span className="small muted">Origin server: 🇺🇸 Virginia</span>
      </div>
      <div className="widget-controls">
        <span className="small muted">Request from:</span>
        {CITIES.map((c) => (
          <button key={c.name} className="btn btn-sm" onClick={() => request(c)}>
            📍 {c.name} {useCdn && cached[c.name] ? '✓' : ''}
          </button>
        ))}
      </div>
      <div className="cdn-results">
        {results.length === 0 && <div className="small muted">Click a city. Then click the same city again.</div>}
        {results.map((r, i) => (
          <div key={i} className="cdn-row fade-in">
            <span className="cdn-city">{r.city}</span>
            <div className="cdn-bar-wrap">
              <div className="cdn-bar" style={{ width: `${Math.min(100, (r.ms / max) * 100)}%`, background: `var(--${r.tone})` }} />
            </div>
            <span className="cdn-ms">{r.ms} ms</span>
            <span className="small muted cdn-note">{r.note}</span>
          </div>
        ))}
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{originHits}</div>
          <div className="l">Requests that reached origin</div>
        </div>
        <div className="stat">
          <div className="v">{results.length ? Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length) : 0} ms</div>
          <div className="l">Avg load time (last 8)</div>
        </div>
      </div>
    </Widget>
  );
}
