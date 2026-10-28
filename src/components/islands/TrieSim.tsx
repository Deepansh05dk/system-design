import { useMemo, useState } from 'react';
import Widget from './Widget';

const QUERIES: [string, number][] = [
  ['system design', 9200],
  ['system design interview', 7400],
  ['system of a down', 5100],
  ['systematic review', 2600],
  ['sydney weather', 8800],
  ['sydney opera house', 3900],
  ['symptoms of covid', 6100],
  ['symphony no 9', 1200],
  ['swiggy', 9900],
  ['swimming pool near me', 4100],
];

interface Node {
  children: Record<string, Node>;
  top: [string, number][];
}

function build(k: number): Node {
  const root: Node = { children: {}, top: [] };
  for (const [q, f] of QUERIES) {
    let n = root;
    const path = [root];
    for (const ch of q) {
      n.children[ch] ||= { children: {}, top: [] };
      n = n.children[ch];
      path.push(n);
    }
    // cache top-k at every node on the path (precomputed suggestions)
    for (const p of path) {
      p.top = [...p.top, [q, f] as [string, number]].sort((a, b) => b[1] - a[1]).slice(0, k);
    }
  }
  return root;
}

export default function TrieSim() {
  const [input, setInput] = useState('sy');
  const [k, setK] = useState(3);
  const root = useMemo(() => build(k), [k]);

  const path: { ch: string; node: Node }[] = [];
  let n: Node | undefined = root;
  for (const ch of input.toLowerCase()) {
    n = n?.children[ch];
    if (!n) break;
    path.push({ ch, node: n });
  }
  const found = n && path.length === input.length ? n : undefined;
  const siblings = path.length ? Object.keys((path.length > 1 ? path[path.length - 2].node : root).children) : Object.keys(root.children);

  return (
    <Widget title="Prefix lookup in a trie with cached top-K" tag="Playground">
      <div className="widget-controls">
        <label style={{ flex: 1 }}>
          🔎
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="type: s, sy, sw…" style={{ flex: 1, minWidth: 160 }} />
        </label>
        <label>
          Top K
          <select value={k} onChange={(e) => setK(+e.target.value)}>
            {[3, 5].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">Path through the trie</div>
          <div className="trie-path">
            <span className="chip accent">root</span>
            {path.map((p, i) => (
              <span key={i} className="trie-step">
                → <span className="chip accent">{p.ch === ' ' ? '␣' : p.ch}</span>
              </span>
            ))}
            {input.length > path.length && <span className="chip bad">no match</span>}
          </div>
          <div className="small muted" style={{ marginTop: 6 }}>
            Steps = length of the prefix ({path.length}), no matter how many queries exist. Children at the last level: {siblings.map((s) => (s === ' ' ? '␣' : s)).join(' ')}
          </div>
        </div>
        <div className="box">
          <div className="box-title">Suggestions (precomputed at this node)</div>
          {found ? (
            found.top.map(([q, f], i) => (
              <div key={q} className="trie-sug fade-in">
                <span>
                  <b>{q.slice(0, input.length)}</b>
                  {q.slice(input.length)}
                </span>
                <span className="small muted">{f.toLocaleString()} searches</span>
                {i === 0 && <span className="pill pill-good">top</span>}
              </div>
            ))
          ) : (
            <div className="small muted">No suggestions.</div>
          )}
        </div>
      </div>
      <div className="result-banner info">
        Each node stores its own top-{k} list, computed offline from search logs. A lookup is just “walk {input.length || 0} characters, read the list”: no sorting at request time. That’s how typeahead answers in a few milliseconds.
      </div>
    </Widget>
  );
}
