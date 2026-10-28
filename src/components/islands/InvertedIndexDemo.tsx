import { useMemo, useState } from 'react';
import Widget from './Widget';

const DOCS = [
  'Red running shoes for men',
  'Blue running jacket',
  'Red cotton t-shirt',
  'Trail running shoes, waterproof',
  'Leather office shoes',
  'Cotton running socks',
];

const STOP = new Set(['for', 'the', 'a', 'and', 'of']);

function tokenize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

export default function InvertedIndexDemo() {
  const [q, setQ] = useState('red running shoes');

  const index = useMemo(() => {
    const idx: Record<string, number[]> = {};
    DOCS.forEach((d, i) => {
      for (const w of new Set(tokenize(d))) (idx[w] ||= []).push(i);
    });
    return idx;
  }, []);

  const terms = tokenize(q);
  const scores = DOCS.map((_, i) => terms.filter((t) => index[t]?.includes(i)).length);
  const ranked = DOCS.map((d, i) => ({ d, i, s: scores[i] }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

  return (
    <Widget title="Build and query an inverted index" tag="Playground">
      <div className="widget-controls">
        <label style={{ flex: 1 }}>
          🔎
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        </label>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">Documents (products)</div>
          {DOCS.map((d, i) => (
            <div key={i} className="small" style={{ padding: '2px 0', opacity: scores[i] ? 1 : 0.5 }}>
              <code>#{i}</code> {d}
            </div>
          ))}
        </div>
        <div className="box">
          <div className="box-title">Inverted index: word → documents</div>
          <div className="ii-list">
            {Object.entries(index)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([w, ids]) => (
                <div key={w} className={`ii-row ${terms.includes(w) ? 'on' : ''}`}>
                  <code>{w}</code>
                  <span>→ [{ids.join(', ')}]</span>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="box" style={{ marginTop: 12 }}>
        <div className="box-title">Results ranked by matching words</div>
        {ranked.length === 0 && <div className="small muted">No matches.</div>}
        {ranked.map((r) => (
          <div key={r.i} className="ii-res fade-in">
            <span className="pill">{r.s} match{r.s > 1 ? 'es' : ''}</span> {r.d}
          </div>
        ))}
      </div>
      <div className="result-banner info">
        Instead of scanning every document for each word (like SQL <code>LIKE '%shoes%'</code>), we jump straight to the list
        for each word and combine them. Real engines add stemming (“running” → “run”), typo tolerance and smarter scoring
        (TF-IDF / BM25).
      </div>
    </Widget>
  );
}
