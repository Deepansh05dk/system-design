import { useState } from 'react';
import Widget from './Widget';

interface Opt {
  text: string;
  good: boolean;
  why: string;
}

const SCENARIOS: { prompt: string; options: Opt[] }[] = [
  {
    prompt: '“Design Instagram.”',
    options: [
      { text: 'Which features matter most: posting photos, feed, follows, likes, comments, stories, DMs?', good: true, why: 'Scopes the problem. You can’t design all of Instagram in 45 minutes.' },
      { text: 'Should I use React or Vue for the web app?', good: false, why: 'Implementation detail, not a system design question.' },
      { text: 'Roughly how many daily active users and photo uploads per day?', good: true, why: 'Scale drives the architecture (sharding, CDN, storage).' },
      { text: 'Is the feed chronological or ranked?', good: true, why: 'Changes the feed generation design significantly.' },
      { text: 'What programming language should the backend use?', good: false, why: 'Rarely matters for the design; don’t spend time here.' },
      { text: 'What latency is acceptable for loading the feed? Can a new post appear a few seconds late?', good: true, why: 'Non-functional requirements: latency and consistency expectations.' },
      { text: 'Should I design the photo filters algorithm?', good: false, why: 'Out of scope for a system design round unless the interviewer asks.' },
    ],
  },
  {
    prompt: '“Design a URL shortener.”',
    options: [
      { text: 'How many new URLs per day, and what’s the read:write ratio?', good: true, why: 'Determines key length, storage and how read-heavy it is (very!).' },
      { text: 'Can users choose a custom alias? Do links expire?', good: true, why: 'Functional requirements that affect the data model and key generation.' },
      { text: 'Do we need click analytics (counts, referrers, locations)?', good: true, why: 'Affects 301 vs 302 redirects and adds an async analytics pipeline.' },
      { text: 'What color should the “Shorten” button be?', good: false, why: 'UI detail, not system design.' },
      { text: 'How short should the code be? Any characters we can’t use?', good: true, why: 'Drives the encoding (base62) and key space math.' },
      { text: 'Should I write the SQL schema migration scripts?', good: false, why: 'Too low-level for the time you have.' },
    ],
  },
];

export default function QuestionPicker() {
  const [s, setS] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const sc = SCENARIOS[s];
  const score = picked.filter((i) => sc.options[i].good).length - picked.filter((i) => !sc.options[i].good).length;
  const goodTotal = sc.options.filter((o) => o.good).length;

  return (
    <Widget title="Pick the clarifying questions a strong candidate would ask" tag="Game">
      <div className="widget-controls">
        {SCENARIOS.map((x, i) => (
          <button key={i} className={`btn btn-sm ${i === s ? 'btn-primary' : ''}`} onClick={() => { setS(i); setPicked([]); }}>
            {x.prompt}
          </button>
        ))}
      </div>
      <div className="qp-prompt">
        Interviewer: <b>{sc.prompt}</b> Click the questions you would ask.
      </div>
      <div className="qp-list">
        {sc.options.map((o, i) => {
          const on = picked.includes(i);
          return (
            <button key={i} className={`qp-opt ${on ? (o.good ? 'good' : 'bad') : ''}`} onClick={() => setPicked(on ? picked.filter((x) => x !== i) : [...picked, i])}>
              <span>{on ? (o.good ? '✓' : '✗') : '○'}</span>
              <div>
                <div>{o.text}</div>
                {on && <div className="small qp-why">{o.why}</div>}
              </div>
            </button>
          );
        })}
      </div>
      {picked.length > 0 && (
        <div className={`result-banner ${score >= goodTotal - 1 ? 'good' : 'warn'}`}>
          Score: {score} / {goodTotal}. {score >= goodTotal - 1 ? 'Great scoping! You focused on features, scale and non-functional needs.' : 'Focus on: core features, scale, and non-functional requirements (latency, consistency, availability). Skip implementation details.'}
        </div>
      )}
    </Widget>
  );
}
