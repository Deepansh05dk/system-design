import { useState } from 'react';
import Widget from './Widget';

type Strat = 'csr' | 'ssr' | 'ssg' | 'stream' | 'islands';

interface Seg {
  label: string;
  ms: number;
  kind: 'net' | 'server' | 'js' | 'idle';
}

const DATA: Record<Strat, { name: string; segs: Seg[]; fcp: number; lcp: number; tti: number; notes: string }> = {
  csr: {
    name: 'CSR (client-side rendering)',
    segs: [
      { label: 'HTML shell (tiny)', ms: 120, kind: 'net' },
      { label: 'Download JS bundle', ms: 600, kind: 'net' },
      { label: 'Parse + run JS', ms: 400, kind: 'js' },
      { label: 'Fetch API data', ms: 350, kind: 'net' },
      { label: 'Render content', ms: 120, kind: 'js' },
    ],
    fcp: 1120,
    lcp: 1590,
    tti: 1590,
    notes: 'Blank/spinner until JS loads and fetches data. Great once loaded (app-like), poor for SEO and slow devices.',
  },
  ssr: {
    name: 'SSR (server-side rendering)',
    segs: [
      { label: 'Server fetches data + renders HTML', ms: 450, kind: 'server' },
      { label: 'Download full HTML', ms: 150, kind: 'net' },
      { label: 'Download JS', ms: 500, kind: 'net' },
      { label: 'Hydrate', ms: 350, kind: 'js' },
    ],
    fcp: 600,
    lcp: 650,
    tti: 1450,
    notes: 'Content visible early (good SEO/LCP), but the server works on every request, and the page isn’t interactive until hydration.',
  },
  ssg: {
    name: 'SSG (static generation, CDN)',
    segs: [
      { label: 'HTML from CDN edge', ms: 80, kind: 'net' },
      { label: 'Download JS', ms: 400, kind: 'net' },
      { label: 'Hydrate', ms: 250, kind: 'js' },
    ],
    fcp: 80,
    lcp: 150,
    tti: 730,
    notes: 'Fastest possible first paint: pre-built HTML served from a CDN. Only works for content that’s the same for everyone (docs, blogs, marketing). ISR rebuilds pages periodically.',
  },
  stream: {
    name: 'Streaming SSR (+ Suspense)',
    segs: [
      { label: 'Shell streamed immediately', ms: 100, kind: 'server' },
      { label: 'Slow data sections stream in', ms: 400, kind: 'server' },
      { label: 'JS + selective hydration', ms: 550, kind: 'js' },
    ],
    fcp: 100,
    lcp: 500,
    tti: 1050,
    notes: 'The server sends the page shell right away and streams slow sections as their data arrives. Parts hydrate independently, so important parts become interactive first.',
  },
  islands: {
    name: 'Islands (Astro) / partial hydration',
    segs: [
      { label: 'Static HTML from CDN', ms: 80, kind: 'net' },
      { label: 'Tiny JS for interactive islands only', ms: 150, kind: 'net' },
      { label: 'Hydrate islands', ms: 80, kind: 'js' },
    ],
    fcp: 80,
    lcp: 150,
    tti: 310,
    notes: 'Mostly static HTML; only interactive widgets ship JavaScript. This very course is built this way: lessons are static, simulators are React islands.',
  },
};

const COLORS = { net: 'var(--k-client)', server: 'var(--k-server)', js: 'var(--k-queue)', idle: 'var(--border)' };

export default function RenderingTimeline() {
  const [s, setS] = useState<Strat>('csr');
  const d = DATA[s];
  const total = 1700;
  return (
    <Widget title="Same page, five rendering strategies (simulated slow 4G)" tag="Compare">
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(DATA) as Strat[]).map((k) => (
            <button key={k} className={k === s ? 'on' : ''} onClick={() => setS(k)}>
              {k === 'csr' ? 'CSR' : k === 'ssr' ? 'SSR' : k === 'ssg' ? 'SSG' : k === 'stream' ? 'Streaming' : 'Islands'}
            </button>
          ))}
        </div>
      </div>
      <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
        {d.name}
      </div>
      <div className="rtl-track">
        {d.segs.map((seg, i) => (
          <div key={i} className="rtl-seg fade-in" style={{ width: `${(seg.ms / total) * 100}%`, background: COLORS[seg.kind] }} title={`${seg.label}: ${seg.ms} ms`}>
            <span>{seg.label}</span>
          </div>
        ))}
        {[['FCP', d.fcp], ['LCP', d.lcp], ['TTI', d.tti]].map(([n, v]) => (
          <div key={n as string} className="rtl-mark" style={{ left: `${((v as number) / total) * 100}%` }}>
            <span>{n}</span>
          </div>
        ))}
      </div>
      <div className="rtl-legend small muted">
        <span>
          <i style={{ background: COLORS.net }} /> network
        </span>
        <span>
          <i style={{ background: COLORS.server }} /> server work
        </span>
        <span>
          <i style={{ background: COLORS.js }} /> JS in browser
        </span>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v">{d.fcp} ms</div>
          <div className="l">First contentful paint</div>
        </div>
        <div className="stat">
          <div className="v">{d.lcp} ms</div>
          <div className="l">Largest contentful paint</div>
        </div>
        <div className="stat">
          <div className="v">{d.tti} ms</div>
          <div className="l">Interactive</div>
        </div>
      </div>
      <div className="result-banner info">{d.notes}</div>
      <div className="small muted">Illustrative numbers to show the shape of each strategy, not a benchmark.</div>
    </Widget>
  );
}
