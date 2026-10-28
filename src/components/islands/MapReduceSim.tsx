import { useState } from 'react';
import Widget from './Widget';

const CHUNKS = ['the cat sat', 'the dog sat', 'a cat ran', 'the cat ate'];

export default function MapReduceSim() {
  const [stage, setStage] = useState(0);
  const mapped = CHUNKS.map((c) => c.split(' ').map((w) => [w, 1] as [string, number]));
  const shuffled: Record<string, number[]> = {};
  mapped.flat().forEach(([w, n]) => (shuffled[w] ||= []).push(n));
  const words = Object.keys(shuffled).sort();
  const reducers = [words.filter((_, i) => i % 2 === 0), words.filter((_, i) => i % 2 === 1)];

  const stages = ['Input split', 'Map', 'Shuffle & sort', 'Reduce'];

  return (
    <Widget title="Count words across 4 machines with MapReduce" tag="Step-through">
      <div className="widget-controls">
        {stages.map((s, i) => (
          <button key={s} className={`btn btn-sm ${stage === i ? 'btn-primary' : ''}`} onClick={() => setStage(i)}>
            {i + 1}. {s}
          </button>
        ))}
      </div>
      <div className="mr-grid">
        {stage === 0 &&
          CHUNKS.map((c, i) => (
            <div key={i} className="box fade-in">
              <div className="box-title">Machine {i + 1} · chunk of file</div>
              <code>“{c}”</code>
            </div>
          ))}
        {stage === 1 &&
          mapped.map((m, i) => (
            <div key={i} className="box fade-in">
              <div className="box-title">Mapper {i + 1}: emit (word, 1)</div>
              <div className="sim-row" style={{ gap: 4 }}>
                {m.map(([w, n], j) => (
                  <span key={j} className="chip accent">
                    ({w}, {n})
                  </span>
                ))}
              </div>
            </div>
          ))}
        {stage === 2 &&
          reducers.map((ws, r) => (
            <div key={r} className="box fade-in" style={{ gridColumn: 'span 2' }}>
              <div className="box-title">To reducer {r + 1} (hash(word) picks the reducer)</div>
              {ws.map((w) => (
                <div key={w} className="small">
                  <code>{w}</code> → [{shuffled[w].join(', ')}]
                </div>
              ))}
            </div>
          ))}
        {stage === 3 &&
          reducers.map((ws, r) => (
            <div key={r} className="box fade-in" style={{ gridColumn: 'span 2' }}>
              <div className="box-title">Reducer {r + 1}: sum the list</div>
              <div className="sim-row" style={{ gap: 4 }}>
                {ws.map((w) => (
                  <span key={w} className="chip good">
                    {w}: {shuffled[w].length}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
      <div className="result-banner info">
        {stage === 0 && 'A huge file (think terabytes) is split into chunks stored on many machines. Code moves to the data, not the other way around.'}
        {stage === 1 && 'MAP runs in parallel on every chunk: turn each record into (key, value) pairs. Here: (word, 1).'}
        {stage === 2 && 'SHUFFLE groups all values for the same key onto the same machine, over the network. This is usually the most expensive step.'}
        {stage === 3 && 'REDUCE combines the values per key. Here: add them up. The output is the word count for the whole file.'}
      </div>
    </Widget>
  );
}
