import { useRef, useState } from 'react';
import Widget from './Widget';

const ROW = 44;
const VIEW = 260;

export default function VirtualListSim() {
  const [count, setCount] = useState(10000);
  const [virtual, setVirtual] = useState(true);
  const [scroll, setScroll] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const overscan = 3;
  const start = Math.max(0, Math.floor(scroll / ROW) - overscan);
  const end = Math.min(count, Math.ceil((scroll + VIEW) / ROW) + overscan);
  const rendered = virtual ? end - start : Math.min(count, 300);
  const domNodes = virtual ? rendered * 4 : count * 4;

  return (
    <Widget title="Rendering a feed with 10,000 posts" tag="Simulator">
      <div className="widget-controls">
        <div className="seg">
          <button className={!virtual ? 'on' : ''} onClick={() => setVirtual(false)}>
            Render everything
          </button>
          <button className={virtual ? 'on' : ''} onClick={() => setVirtual(true)}>
            Virtualized (windowing)
          </button>
        </div>
        <label>
          Items
          <select value={count} onChange={(e) => setCount(+e.target.value)}>
            {[100, 1000, 10000, 100000].map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="two-col">
        <div
          ref={ref}
          className="vl-viewport"
          style={{ height: VIEW }}
          onScroll={(e) => setScroll((e.target as HTMLDivElement).scrollTop)}
        >
          <div style={{ height: count * ROW, position: 'relative' }}>
            {virtual
              ? Array.from({ length: end - start }).map((_, i) => {
                  const idx = start + i;
                  return (
                    <div key={idx} className="vl-row" style={{ top: idx * ROW, height: ROW }}>
                      <span className="vl-avatar" style={{ background: `hsl(${(idx * 47) % 360} 60% 60%)` }} />
                      Post #{idx + 1}
                    </div>
                  );
                })
              : Array.from({ length: Math.min(count, 300) }).map((_, idx) => (
                  <div key={idx} className="vl-row" style={{ top: idx * ROW, height: ROW }}>
                    <span className="vl-avatar" style={{ background: `hsl(${(idx * 47) % 360} 60% 60%)` }} />
                    Post #{idx + 1}
                  </div>
                ))}
          </div>
        </div>
        <div>
          <div className="stat-row">
            <div className="stat">
              <div className="v" style={{ color: domNodes > 5000 ? 'var(--bad)' : 'var(--good)' }}>{domNodes.toLocaleString()}</div>
              <div className="l">DOM nodes for the list</div>
            </div>
            <div className="stat">
              <div className="v">{virtual ? `${start + 1}–${end}` : 'all'}</div>
              <div className="l">Rows actually in the DOM</div>
            </div>
          </div>
          <div className={`result-banner ${virtual ? 'good' : 'bad'}`}>
            {virtual
              ? `Only ~${rendered} rows exist in the DOM at any time (visible + a few extra). Scrolling swaps which rows are rendered. Memory and layout cost stay flat no matter how long the feed gets.`
              : `Rendering ${count.toLocaleString()} rows creates ~${(count * 4).toLocaleString()} DOM nodes: slow first render, janky scrolling and high memory on phones. (This demo caps at 300 rows so your browser survives.)`}
          </div>
        </div>
      </div>
    </Widget>
  );
}
