import { useEffect, useState } from 'react';
import Widget from './Widget';

// 40 rows with "random" emails, stored in insertion order (not sorted)
const NAMES = ['zoe', 'amit', 'li', 'omar', 'nina', 'raj', 'eva', 'sam', 'kim', 'dev', 'ana', 'tom', 'uma', 'joe', 'ivy', 'ben', 'mia', 'leo', 'ria', 'max', 'pia', 'jay', 'kai', 'noa', 'eli', 'ash', 'fay', 'gus', 'hal', 'ida', 'jon', 'kit', 'lou', 'meg', 'ned', 'oli', 'pat', 'quinn', 'rex', 'sia'];
const ROWS = NAMES.map((n, i) => ({ id: i + 1, email: `${n}@mail.com` }));
const SORTED = [...ROWS].sort((a, b) => a.email.localeCompare(b.email));

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

export default function IndexSim() {
  const [target, setTarget] = useState('sam@mail.com');
  const [scanPos, setScanPos] = useState(-1);
  const [treeStep, setTreeStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [n, setN] = useState(6);

  const targetIdx = ROWS.findIndex((r) => r.email === target);
  const sortedIdx = SORTED.findIndex((r) => r.email === target);
  // a 3-level tree over 40 sorted keys: root splits into 4 groups of 10, each group into leaf pages of ~3-4
  const group = Math.floor(sortedIdx / 10);
  const leaf = Math.floor((sortedIdx % 10) / 4);

  useEffect(() => {
    if (!running) return;
    const done = scanPos >= targetIdx && treeStep >= 3;
    if (done) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => {
      setScanPos((p) => Math.min(p + 1, targetIdx));
      setTreeStep((s) => Math.min(s + 1, 3));
    }, 160);
    return () => clearTimeout(t);
  }, [running, scanPos, treeStep, targetIdx]);

  const start = () => {
    setScanPos(-1);
    setTreeStep(-1);
    setRunning(true);
  };

  const rowCount = 10 ** n;
  const scanReads = rowCount / 2;
  const treeReads = Math.max(1, Math.ceil(Math.log(rowCount) / Math.log(200)));

  return (
    <Widget title="Find WHERE email = ? with and without an index" tag="Simulator">
      <div className="widget-controls">
        <label>
          Search for
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {ROWS.map((r) => (
              <option key={r.id}>{r.email}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" onClick={start} disabled={running}>
          ▶ Run query
        </button>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">❌ No index: full table scan</div>
          <div className="idx-rows">
            {ROWS.map((r, i) => (
              <span key={r.id} className={`idx-cell ${i < scanPos ? 'seen' : ''} ${i === scanPos ? (i === targetIdx ? 'found' : 'cur') : ''}`} title={r.email}>
                {r.email.split('@')[0]}
              </span>
            ))}
          </div>
          <div className="small" style={{ marginTop: 6 }}>
            Rows checked: <b>{Math.max(0, scanPos + 1)}</b> of {ROWS.length}
          </div>
        </div>
        <div className="box">
          <div className="box-title">✅ B-tree index on email</div>
          <div className="idx-tree">
            <div className={`idx-node ${treeStep >= 0 ? 'on' : ''}`}>
              {[0, 1, 2, 3].map((g) => (
                <span key={g} className={treeStep >= 0 && g === group ? 'pick' : ''}>
                  {SORTED[g * 10].email.split('@')[0]}…
                </span>
              ))}
            </div>
            <div className="idx-level">
              {[0, 1, 2, 3].map((g) => (
                <div key={g} className={`idx-node small ${treeStep >= 1 && g === group ? 'on' : ''}`}>
                  {[0, 1, 2].map((l) => (
                    <span key={l} className={treeStep >= 1 && g === group && l === leaf ? 'pick' : ''}>
                      {SORTED[Math.min(39, g * 10 + l * 4)].email.split('@')[0]}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className={`idx-leaf ${treeStep >= 2 ? 'on' : ''}`}>
              Leaf page:{' '}
              {SORTED.slice(group * 10 + leaf * 4, Math.min(group * 10 + leaf * 4 + 4, group * 10 + 10)).map((r) => (
                <span key={r.id} className={treeStep >= 3 && r.email === target ? 'pick' : ''}>
                  {r.email.split('@')[0]}→row {r.id}
                </span>
              ))}
            </div>
          </div>
          <div className="small" style={{ marginTop: 6 }}>
            Pages read: <b>{Math.max(0, treeStep + 1)}</b> (root → branch → leaf → row)
          </div>
        </div>
      </div>
      <div className="box" style={{ marginTop: 12 }}>
        <div className="box-title">Now scale it up</div>
        <label className="small">
          Table size: <b>{fmt(rowCount)}</b> rows
          <input type="range" min={3} max={10} value={n} onChange={(e) => setN(+e.target.value)} style={{ width: 200, marginLeft: 8 }} />
        </label>
        <div className="stat-row">
          <div className="stat">
            <div className="v" style={{ color: 'var(--bad)' }}>{fmt(scanReads)}</div>
            <div className="l">Rows scanned (avg, no index)</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--good)' }}>{treeReads}</div>
            <div className="l">Page reads with B-tree (~200 keys/page)</div>
          </div>
        </div>
        <div className="small muted">
          A B-tree's depth grows with log(N). Even 10 billion rows need only ~5 page reads, and the top levels are usually cached in memory.
        </div>
      </div>
    </Widget>
  );
}
