import { useState } from 'react';
import Widget from './Widget';

const M = 24;
function hashes(s: string): number[] {
  const out: number[] = [];
  for (let k = 0; k < 3; k++) {
    let h = 2166136261 ^ (k * 16777619);
    for (const c of s.toLowerCase()) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619 + k * 2) >>> 0;
    }
    h ^= h >>> 15;
    out.push(h % M);
  }
  return out;
}

export default function BloomFilterSim() {
  const [bits, setBits] = useState<boolean[]>(Array(M).fill(false));
  const [added, setAdded] = useState<string[]>([]);
  const [word, setWord] = useState('cat');
  const [result, setResult] = useState<{ text: string; tone: string } | null>(null);
  const [highlight, setHighlight] = useState<number[]>([]);

  const add = () => {
    const w = word.trim();
    if (!w) return;
    const hs = hashes(w);
    setBits((b) => b.map((v, i) => v || hs.includes(i)));
    setAdded((a) => (a.includes(w) ? a : [...a, w]));
    setHighlight(hs);
    setResult({ text: `Added “${w}”: set bits ${hs.join(', ')} to 1.`, tone: 'info' });
  };

  const check = () => {
    const w = word.trim();
    if (!w) return;
    const hs = hashes(w);
    setHighlight(hs);
    const all = hs.every((i) => bits[i]);
    if (!all) setResult({ text: `“${w}”: bit ${hs.find((i) => !bits[i])} is 0 → DEFINITELY NOT in the set. (Skip the database!)`, tone: 'good' });
    else if (added.includes(w)) setResult({ text: `“${w}”: bits ${hs.join(', ')} are all 1 → PROBABLY in the set. (It is.)`, tone: 'info' });
    else setResult({ text: `“${w}”: bits ${hs.join(', ')} are all 1 → PROBABLY in the set… but it was never added! A FALSE POSITIVE. (Only costs one extra DB lookup.)`, tone: 'warn' });
  };

  const filled = bits.filter(Boolean).length;
  // false positive probability approximation: (1 - e^(-kn/m))^k
  const fp = Math.pow(1 - Math.exp((-3 * added.length) / M), 3);

  return (
    <Widget title={`Bloom filter: ${M} bits, 3 hash functions`} tag="Playground">
      <div className="widget-controls">
        <input type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="a word" style={{ width: 140 }} />
        <button className="btn btn-primary" onClick={add}>
          ➕ Add
        </button>
        <button className="btn" onClick={check}>
          🔍 Check
        </button>
        <button className="btn" onClick={() => { setBits(Array(M).fill(false)); setAdded([]); setResult(null); setHighlight([]); }}>
          ↺ Clear
        </button>
      </div>
      <div className="bf-bits">
        {bits.map((b, i) => (
          <div key={i} className={`bf-bit ${b ? 'on' : ''} ${highlight.includes(i) ? 'hl' : ''}`}>
            <span>{b ? 1 : 0}</span>
            <small>{i}</small>
          </div>
        ))}
      </div>
      {result && <div className={`result-banner ${result.tone}`}>{result.text}</div>}
      <div className="stat-row">
        <div className="stat">
          <div className="v">{added.length}</div>
          <div className="l">Items added</div>
        </div>
        <div className="stat">
          <div className="v">{filled}/{M}</div>
          <div className="l">Bits set</div>
        </div>
        <div className="stat">
          <div className="v">{(fp * 100).toFixed(1)}%</div>
          <div className="l">False-positive chance</div>
        </div>
      </div>
      <div className="small muted">
        Added: {added.length ? added.join(', ') : 'nothing yet'}. Try adding cat, dog, fish, bird, lion, then checking words you never added.
      </div>
    </Widget>
  );
}
