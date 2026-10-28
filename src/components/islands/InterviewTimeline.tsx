import { useState } from 'react';
import Widget from './Widget';

const PHASES = [
  {
    name: 'Requirements',
    mins: 5,
    color: 'var(--k-client)',
    goal: 'Turn a vague prompt into a clear, agreed scope.',
    do: ['Ask about the core features (3–5). Write them down.', 'Ask about scale: users, read/write ratio, data size, regions.', 'Ask about non-functional needs: latency, availability, consistency.', 'State what’s OUT of scope.'],
    say: '“Before designing, let me clarify the requirements. The core features are A, B, C. I’ll leave out X and Y unless you want them. Is that right?”',
  },
  {
    name: 'Estimation',
    mins: 4,
    color: 'var(--k-queue)',
    goal: 'Size the problem to guide decisions.',
    do: ['QPS for reads and writes, peak.', 'Storage per day/year.', 'Bandwidth if media is involved.', 'Draw a conclusion: read-heavy? needs sharding?'],
    say: '“About 4K writes/sec and 200K reads/sec at peak: very read-heavy, so caching and precomputation matter most.”',
  },
  {
    name: 'API & data model',
    mins: 6,
    color: 'var(--k-lb)',
    goal: 'Define the contract and the main entities.',
    do: ['3–6 key endpoints with inputs/outputs.', 'Main tables/entities and their keys.', 'Pick the database(s) with a reason.', 'Mention the index for the main query.'],
    say: '“POST /tweets, GET /users/{id}/timeline?cursor=… Tweets table keyed by tweet_id, sharded by user_id…”',
  },
  {
    name: 'High-level design',
    mins: 12,
    color: 'var(--k-server)',
    goal: 'Draw the boxes and arrows that satisfy every functional requirement.',
    do: ['Start simple: client → LB → services → DB.', 'Walk through each core feature as a request flow.', 'Add cache, queue, CDN, object storage only where needed, and say why.', 'Keep checking the requirements list.'],
    say: '“Let me walk through posting a tweet end to end, then reading the timeline.”',
  },
  {
    name: 'Deep dives',
    mins: 13,
    color: 'var(--k-worker)',
    goal: 'Go deep on the 2–3 hardest parts and their trade-offs.',
    do: ['Pick the bottleneck (or follow the interviewer’s lead).', 'Compare options: “A vs B, I choose A because…”.', 'Handle scale: sharding, hot keys, caching strategy.', 'Handle failures: what if X dies?'],
    say: '“The hardest part is fan-out for celebrities. Two options… I’d use a hybrid because…”',
  },
  {
    name: 'Wrap-up',
    mins: 5,
    color: 'var(--k-cdn)',
    goal: 'Show maturity: bottlenecks, monitoring, evolution.',
    do: ['Summarize the design in 30 seconds.', 'Name remaining bottlenecks and risks.', 'Monitoring/alerting, security in a sentence.', 'What you’d do next with more time / at 10× scale.'],
    say: '“To recap… The next bottleneck at 10× would be X; I’d address it by Y.”',
  },
];

export default function InterviewTimeline() {
  const [sel, setSel] = useState(0);
  const total = PHASES.reduce((s, p) => s + p.mins, 0);
  const p = PHASES[sel];
  return (
    <Widget title={`A ${total}-minute system design interview`} tag="Plan">
      <div className="it-bar">
        {PHASES.map((ph, i) => (
          <button key={ph.name} className={`it-seg ${i === sel ? 'on' : ''}`} style={{ flex: ph.mins, background: ph.color }} onClick={() => setSel(i)}>
            <span>{ph.name}</span>
            <small>{ph.mins}m</small>
          </button>
        ))}
      </div>
      <div className="box fade-in" key={sel} style={{ marginTop: 10 }}>
        <div className="box-title" style={{ color: p.color }}>
          Step {sel + 1}: {p.name} · ~{p.mins} min
        </div>
        <div style={{ fontWeight: 650, marginBottom: 6 }}>{p.goal}</div>
        <ul className="small" style={{ margin: '0 0 8px', paddingLeft: '1.2rem' }}>
          {p.do.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <div className="result-banner info" style={{ marginTop: 0 }}>
          🗣️ {p.say}
        </div>
      </div>
      <div className="widget-controls" style={{ marginTop: 10 }}>
        <button className="btn btn-sm" onClick={() => setSel(Math.max(0, sel - 1))} disabled={sel === 0}>
          ◀ Prev
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => setSel(Math.min(PHASES.length - 1, sel + 1))} disabled={sel === PHASES.length - 1}>
          Next ▶
        </button>
      </div>
    </Widget>
  );
}
