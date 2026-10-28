import { useState } from 'react';
import Widget from './Widget';

const BASE = 'HELLO';

export default function OtSim() {
  const [mode, setMode] = useState<'naive' | 'ot'>('naive');
  const [step, setStep] = useState(0);

  // Asha inserts "!" at index 5 (end). Ravi inserts "OH " at index 0. Concurrently, both based on "HELLO".
  const asha = { pos: 5, text: '!' };
  const ravi = { pos: 0, text: 'OH ' };

  const apply = (s: string, op: { pos: number; text: string }) => s.slice(0, op.pos) + op.text + s.slice(op.pos);
  const ashaLocal = apply(BASE, asha); // HELLO!
  const raviLocal = apply(BASE, ravi); // OH HELLO

  // transform Asha's op against Ravi's (Ravi inserted before Asha's position → shift right)
  const ashaT = { ...asha, pos: asha.pos + (ravi.pos <= asha.pos ? ravi.text.length : 0) };
  const raviT = { ...ravi, pos: ravi.pos + (asha.pos < ravi.pos ? asha.text.length : 0) };

  const ashaFinal = mode === 'naive' ? apply(ashaLocal, ravi) : apply(ashaLocal, raviT);
  const raviFinal = mode === 'naive' ? apply(raviLocal, asha) : apply(raviLocal, ashaT);
  const converged = ashaFinal === raviFinal;

  const steps = [
    'Both start with the same document.',
    'Each user types at the same time. Each sees their own edit immediately (local-first).',
    'Each receives the OTHER user’s operation and applies it.',
  ];

  return (
    <Widget title="Two people type at the same time" tag="Step-through">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'naive' ? 'on' : ''} onClick={() => setMode('naive')}>
            Apply ops as-is
          </button>
          <button className={mode === 'ot' ? 'on' : ''} onClick={() => setMode('ot')}>
            Transform ops (OT)
          </button>
        </div>
        <button className="btn btn-sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ◀
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => setStep(Math.min(2, step + 1))} disabled={step === 2}>
          Next ▶
        </button>
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        Step {step + 1}/3: {steps[step]}
      </div>
      <div className="two-col">
        {[
          { who: '👩 Asha', local: ashaLocal, op: `insert "!" at 5`, recv: mode === 'naive' ? `insert "OH " at 0` : `insert "OH " at ${raviT.pos}`, final: ashaFinal },
          { who: '👨 Ravi', local: raviLocal, op: `insert "OH " at 0`, recv: mode === 'naive' ? `insert "!" at 5` : `insert "!" at ${ashaT.pos} (shifted +3)`, final: raviFinal },
        ].map((u) => (
          <div key={u.who} className="box">
            <div className="box-title">{u.who}</div>
            <div className="ot-doc">{step === 0 ? BASE : step === 1 ? u.local : u.final}</div>
            {step >= 1 && <div className="small">My op: <code>{u.op}</code></div>}
            {step >= 2 && <div className="small">Received: <code>{u.recv}</code></div>}
          </div>
        ))}
      </div>
      {step === 2 && (
        <div className={`result-banner ${converged ? 'good' : 'bad'}`}>
          {converged
            ? `✓ Both see "${ashaFinal}". Ravi's view shifted Asha's insert position by 3 because Ravi's own insert came before it. Documents converge.`
            : `✗ Asha sees "${ashaFinal}", Ravi sees "${raviFinal}". Applying Asha's "insert at 5" to Ravi's longer text puts "!" in the wrong place. The documents diverged!`}
        </div>
      )}
    </Widget>
  );
}
