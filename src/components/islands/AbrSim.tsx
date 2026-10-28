import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

const RENDITIONS = [
  { name: '240p', kbps: 400 },
  { name: '360p', kbps: 800 },
  { name: '480p', kbps: 1400 },
  { name: '720p', kbps: 2800 },
  { name: '1080p', kbps: 5000 },
  { name: '4K', kbps: 16000 },
];
const SEG = 4; // seconds per segment

export default function AbrSim() {
  const [bandwidth, setBandwidth] = useState(3500); // kbps
  const [adaptive, setAdaptive] = useState(true);
  const [fixed, setFixed] = useState(4);
  const [segments, setSegments] = useState<{ q: number; stall: boolean }[]>([]);
  const [buffer, setBuffer] = useState(8);
  const [playing, setPlaying] = useState(false);
  const bwRef = useRef(bandwidth);
  bwRef.current = bandwidth;
  const bufRef = useRef(buffer);
  bufRef.current = buffer;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const bw = bwRef.current;
      let q: number;
      if (adaptive) {
        // pick the highest rendition below ~80% of measured bandwidth; be extra careful when the buffer is low
        const safety = bufRef.current < 6 ? 0.5 : 0.8;
        q = 0;
        RENDITIONS.forEach((r, i) => {
          if (r.kbps <= bw * safety) q = i;
        });
      } else q = fixed;
      const downloadTime = (RENDITIONS[q].kbps * SEG) / bw; // seconds to fetch one segment
      let buf = bufRef.current - downloadTime + SEG;
      const stall = bufRef.current - downloadTime < 0;
      buf = Math.max(0, Math.min(30, buf));
      setBuffer(buf);
      setSegments((s) => [...s, { q, stall }].slice(-32));
    }, 600);
    return () => clearInterval(id);
  }, [playing, adaptive, fixed]);

  const stalls = segments.filter((s) => s.stall).length;
  const avgQ = segments.length ? segments.reduce((s, x) => s + x.q, 0) / segments.length : 0;

  return (
    <Widget title="Adaptive bitrate streaming: change your network speed" tag="Simulator">
      <div className="widget-controls">
        <button className="btn btn-primary" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸ Pause' : '▶ Play video'}
        </button>
        <label>
          Network: <b>{(bandwidth / 1000).toFixed(1)} Mbps</b>
          <input type="range" min={300} max={25000} step={100} value={bandwidth} onChange={(e) => setBandwidth(+e.target.value)} style={{ width: 180 }} />
        </label>
        <div className="seg">
          <button className={adaptive ? 'on' : ''} onClick={() => setAdaptive(true)}>
            Adaptive (ABR)
          </button>
          <button className={!adaptive ? 'on' : ''} onClick={() => setAdaptive(false)}>
            Fixed quality
          </button>
        </div>
        {!adaptive && (
          <select value={fixed} onChange={(e) => setFixed(+e.target.value)}>
            {RENDITIONS.map((r, i) => (
              <option key={r.name} value={i}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <button className="btn btn-sm" onClick={() => { setSegments([]); setBuffer(8); }}>
          ↺ Reset
        </button>
      </div>
      <div className="abr-chart">
        {segments.map((s, i) => (
          <div key={i} className="abr-col" title={`${RENDITIONS[s.q].name}${s.stall ? ' (stalled)' : ''}`}>
            <div className="abr-bar" style={{ height: `${((s.q + 1) / RENDITIONS.length) * 100}%`, background: s.stall ? 'var(--bad)' : 'var(--accent)' }} />
          </div>
        ))}
        {!segments.length && <div className="small muted" style={{ margin: 'auto' }}>Press play, then drag the network slider down and up.</div>}
      </div>
      <div className="abr-legend small muted">
        {RENDITIONS.map((r) => (
          <span key={r.name}>
            {r.name}: {(r.kbps / 1000).toFixed(1)} Mbps
          </span>
        ))}
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{segments.length ? RENDITIONS[segments[segments.length - 1].q].name : '–'}</div>
          <div className="l">Current quality</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: buffer < 4 ? 'var(--bad)' : 'var(--good)' }}>{buffer.toFixed(1)} s</div>
          <div className="l">Buffer ahead</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: stalls ? 'var(--bad)' : 'var(--good)' }}>{stalls}</div>
          <div className="l">Buffering spinners 😩</div>
        </div>
        <div className="stat">
          <div className="v">{segments.length ? RENDITIONS[Math.round(avgQ)].name : '–'}</div>
          <div className="l">Typical quality</div>
        </div>
      </div>
      <div className="small muted">
        The video was pre-encoded into 6 qualities and cut into {SEG}-second segments. Before each segment, the player measures bandwidth and buffer, and picks a quality. Fixed 1080p on a slow network = endless buffering.
      </div>
    </Widget>
  );
}
