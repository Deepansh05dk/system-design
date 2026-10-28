import { useState } from 'react';
import Widget from './Widget';

type Mode = 'offset' | 'cursor';
const PAGE = 4;

export default function PaginationSim() {
  const [mode, setMode] = useState<Mode>('offset');
  // feed is newest-first; ids increase over time
  const [feed, setFeed] = useState<number[]>(() => Array.from({ length: 14 }, (_, i) => 114 - i));
  const [pages, setPages] = useState<number[][]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [nextId, setNextId] = useState(115);

  const loadMore = () => {
    let page: number[];
    if (mode === 'offset') {
      const offset = pages.length * PAGE;
      page = feed.slice(offset, offset + PAGE);
    } else {
      page = (cursor === null ? feed : feed.filter((id) => id < cursor)).slice(0, PAGE);
      if (page.length) setCursor(page[page.length - 1]);
    }
    setPages((p) => [...p, page]);
  };

  const newPosts = () => {
    setFeed((f) => [nextId + 1, nextId, ...f]);
    setNextId((n) => n + 2);
  };

  const reset = (m: Mode = mode) => {
    setMode(m);
    setFeed(Array.from({ length: 14 }, (_, i) => 114 - i));
    setPages([]);
    setCursor(null);
    setNextId(115);
  };

  const seen = pages.flat();
  const dupes = seen.filter((id, i) => seen.indexOf(id) !== i);

  return (
    <Widget title="Infinite scroll while new posts keep arriving" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'offset' ? 'on' : ''} onClick={() => reset('offset')}>
            Offset (LIMIT 4 OFFSET n)
          </button>
          <button className={mode === 'cursor' ? 'on' : ''} onClick={() => reset('cursor')}>
            Cursor (WHERE id &lt; last)
          </button>
        </div>
      </div>
      <div className="widget-controls">
        <button className="btn btn-primary" onClick={loadMore}>
          ⬇ Load next page
        </button>
        <button className="btn" onClick={newPosts}>
          🆕 2 new posts published
        </button>
        <button className="btn" onClick={() => reset()}>
          ↺ Reset
        </button>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">Server: feed (newest first)</div>
          <div className="sim-row" style={{ gap: 4 }}>
            {feed.map((id) => (
              <span key={id} className={`chip ${id >= 115 ? 'accent' : ''}`}>
                #{id}
              </span>
            ))}
          </div>
        </div>
        <div className="box">
          <div className="box-title">What the user has seen</div>
          {pages.map((p, i) => (
            <div key={i} className="sim-row fade-in" style={{ gap: 4, marginBottom: 4 }}>
              <span className="small muted" style={{ width: 54 }}>
                page {i + 1}
              </span>
              {p.map((id, j) => (
                <span key={j} className={`chip ${dupes.includes(id) ? 'bad' : 'good'}`}>
                  #{id}
                </span>
              ))}
            </div>
          ))}
          {!pages.length && <div className="small muted">Load page 1, publish new posts, then load page 2.</div>}
          {mode === 'cursor' && cursor !== null && (
            <div className="small" style={{ marginTop: 4 }}>
              Next request: <code>?cursor={cursor}</code> → <code>WHERE id &lt; {cursor} ORDER BY id DESC LIMIT 4</code>
            </div>
          )}
          {mode === 'offset' && pages.length > 0 && (
            <div className="small" style={{ marginTop: 4 }}>
              Next request: <code>LIMIT 4 OFFSET {pages.length * PAGE}</code>
            </div>
          )}
        </div>
      </div>
      {dupes.length > 0 && (
        <div className="result-banner bad">
          Duplicates: {[...new Set(dupes)].map((d) => `#${d}`).join(', ')}. New posts pushed everything down, so “offset 4” now points at posts the user already saw.
        </div>
      )}
      {mode === 'cursor' && pages.length > 1 && <div className="result-banner good">No duplicates, no gaps. The cursor says “continue after #X”, which stays correct no matter what is inserted at the top.</div>}
    </Widget>
  );
}
