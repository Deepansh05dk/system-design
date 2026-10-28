import { useState } from 'react';

export interface SeqActor {
  id: string;
  label: string;
  icon?: string;
}

export interface SeqMessage {
  from: string;
  to: string;
  label: string;
  note?: string;
  dashed?: boolean;
  bad?: boolean;
}

/** Step-through sequence diagram: who sends what to whom, in order. */
export default function SequenceFlow({
  title = 'Message sequence',
  actors,
  messages,
}: {
  title?: string;
  actors: SeqActor[];
  messages: SeqMessage[];
}) {
  const [shown, setShown] = useState(1);
  const width = 820;
  const top = 64;
  const row = 48;
  const height = top + messages.length * row + 24;
  const margin = 90;
  const gap = actors.length > 1 ? (width - margin * 2) / (actors.length - 1) : 0;
  const xOf = Object.fromEntries(actors.map((a, i) => [a.id, margin + i * gap]));
  const current = messages[shown - 1];

  return (
    <div className="widget seqflow">
      <div className="widget-head">
        <span className="tag">Sequence</span>
        <span>{title}</span>
      </div>
      <div className="af-canvas">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <defs>
            <marker id="sq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-soft)" />
            </marker>
            <marker id="sq-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="sq-arrow-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--bad)" />
            </marker>
          </defs>
          {actors.map((a) => (
            <g key={a.id}>
              <line x1={xOf[a.id]} y1={top - 8} x2={xOf[a.id]} y2={height - 8} stroke="var(--border-strong)" strokeDasharray="4 5" />
              <rect x={xOf[a.id] - 70} y={8} width={140} height={40} rx={10} fill="var(--surface-2)" stroke="var(--border-strong)" />
              <text x={xOf[a.id]} y={33} textAnchor="middle" className="af-label">
                {a.icon ? `${a.icon} ` : ''}
                {a.label}
              </text>
            </g>
          ))}
          {messages.slice(0, shown).map((m, idx) => {
            const y = top + idx * row + row / 2;
            const x1 = xOf[m.from];
            const x2 = xOf[m.to];
            const isCur = idx === shown - 1;
            const color = m.bad ? 'var(--bad)' : isCur ? 'var(--accent)' : 'var(--text-soft)';
            const marker = m.bad ? 'sq-arrow-bad' : isCur ? 'sq-arrow-hot' : 'sq-arrow';
            const self = m.from === m.to;
            const d = self ? `M${x1},${y - 8} h40 v16 h-38` : `M${x1},${y} L${x2 + (x2 > x1 ? -4 : 4)},${y}`;
            return (
              <g key={idx} className={isCur ? 'sq-cur' : ''}>
                <path d={d} fill="none" stroke={color} strokeWidth={isCur ? 2.4 : 1.6} strokeDasharray={m.dashed ? '6 4' : undefined} markerEnd={`url(#${marker})`} className={isCur ? 'sq-draw' : ''} />
                <text x={self ? x1 + 48 : (x1 + x2) / 2} y={self ? y + 4 : y - 7} textAnchor={self ? 'start' : 'middle'} className="af-elabel" style={{ fill: color, fontWeight: isCur ? 700 : 500 }}>
                  {idx + 1}. {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="af-caption">
        {current?.note && (
          <div className="af-step-text" dangerouslySetInnerHTML={{ __html: `<strong>Step ${shown}:</strong> ${current.note}` }} />
        )}
        <div className="af-controls">
          <button className="btn btn-sm" onClick={() => setShown(Math.max(1, shown - 1))} disabled={shown === 1}>
            ◀ Prev
          </button>
          <span className="muted small">
            {shown}/{messages.length}
          </span>
          <button className="btn btn-sm" onClick={() => setShown(messages.length)}>
            Show all
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setShown(Math.min(messages.length, shown + 1))} disabled={shown === messages.length}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}
