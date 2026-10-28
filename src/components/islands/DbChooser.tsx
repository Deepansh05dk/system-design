import { useState } from 'react';
import Widget from './Widget';

interface Q {
  id: string;
  text: string;
}
const QUESTIONS: Q[] = [
  { id: 'tx', text: 'Do you need multi-row transactions with strong guarantees (money, inventory, bookings)?' },
  { id: 'rel', text: 'Is the data highly relational, with many JOINs and ad-hoc queries (reports, admin filters)?' },
  { id: 'scale', text: 'Do you expect massive write volume (100K+ writes/sec) or data that won’t fit on a few machines?' },
  { id: 'kv', text: 'Is access almost always “get/put by a single key” (sessions, carts, profiles)?' },
  { id: 'flex', text: 'Does the shape of each record vary a lot, or change often (product catalog with different attributes)?' },
  { id: 'graph', text: 'Are the main queries about relationships many hops deep (friends-of-friends, recommendations)?' },
  { id: 'search', text: 'Do users need full-text search with relevance ranking and typo tolerance?' },
  { id: 'ts', text: 'Is the data mainly timestamped measurements (metrics, IoT readings, stock ticks)?' },
];

const DBS = {
  sql: { name: 'Relational (PostgreSQL / MySQL)', icon: '🐘', why: 'Strong ACID transactions, flexible queries with JOINs, mature tooling. The safe default for most products.' },
  doc: { name: 'Document store (MongoDB)', icon: '📄', why: 'Flexible JSON documents, each record can have its own shape. Data that is read together is stored together.' },
  kv: { name: 'Key-value (Redis / DynamoDB)', icon: '🔑', why: 'Extremely fast lookups by key, scales horizontally with little effort.' },
  wide: { name: 'Wide-column (Cassandra / ScyllaDB)', icon: '📊', why: 'Built for huge write throughput across many machines, with tunable consistency.' },
  graph: { name: 'Graph DB (Neo4j)', icon: '🕸️', why: 'Relationship traversals are first-class and fast, even many hops deep.' },
  search: { name: 'Search engine (Elasticsearch / OpenSearch)', icon: '🔎', why: 'Inverted indexes for full-text search, ranking, fuzzy matching. Usually a secondary store fed from the main DB.' },
  ts: { name: 'Time-series DB (TimescaleDB / InfluxDB)', icon: '⏱️', why: 'Optimized for append-only timestamped data, downsampling and time-range queries.' },
};

export default function DbChooser() {
  const [ans, setAns] = useState<Record<string, boolean | undefined>>({});
  const set = (id: string, v: boolean) => setAns({ ...ans, [id]: v });

  const scores: Record<keyof typeof DBS, number> = { sql: 1, doc: 0, kv: 0, wide: 0, graph: 0, search: 0, ts: 0 };
  const notes: string[] = [];
  if (ans.tx) {
    scores.sql += 3;
    notes.push('Strong transactions → relational databases shine.');
  }
  if (ans.rel) {
    scores.sql += 2;
    notes.push('Lots of JOINs and ad-hoc queries → relational.');
  }
  if (ans.scale) {
    scores.wide += 3;
    scores.kv += 2;
    notes.push('Huge write scale → wide-column / key-value stores scale out more easily (relational can too, with sharding work).');
  }
  if (ans.kv) {
    scores.kv += 3;
    notes.push('Single-key access → a key-value store is simplest and fastest.');
  }
  if (ans.flex) {
    scores.doc += 3;
    notes.push('Varying shapes → a document store (or JSONB columns in Postgres).');
  }
  if (ans.graph) {
    scores.graph += 4;
    notes.push('Deep relationship traversal → graph database.');
  }
  if (ans.search) {
    scores.search += 4;
    notes.push('Full-text search → add a search engine next to your main database.');
  }
  if (ans.ts) {
    scores.ts += 4;
    notes.push('Timestamped measurements → time-series database.');
  }
  const answered = Object.keys(ans).length;
  const ranked = (Object.keys(scores) as (keyof typeof DBS)[]).sort((a, b) => scores[b] - scores[a]);
  const top = ranked.filter((k) => scores[k] > 0 && scores[k] >= scores[ranked[0]] - 1).slice(0, 3);

  return (
    <Widget title="Which database fits? Answer like you would in an interview" tag="Decision helper">
      <div className="dbc-list">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="dbc-q">
            <span>{q.text}</span>
            <div className="seg">
              <button className={ans[q.id] === true ? 'on' : ''} onClick={() => set(q.id, true)}>
                Yes
              </button>
              <button className={ans[q.id] === false ? 'on' : ''} onClick={() => set(q.id, false)}>
                No
              </button>
            </div>
          </div>
        ))}
      </div>
      {answered > 0 && (
        <div className="box fade-in" style={{ marginTop: 12 }} key={JSON.stringify(ans)}>
          <div className="box-title">Suggestion</div>
          {top.map((k, i) => (
            <div key={k} className="dbc-pick">
              <span className="dbc-icon">{DBS[k].icon}</span>
              <div>
                <b>
                  {i === 0 ? 'Primary: ' : 'Also consider: '}
                  {DBS[k].name}
                </b>
                <div className="small muted">{DBS[k].why}</div>
              </div>
            </div>
          ))}
          {notes.length > 0 && (
            <ul className="small" style={{ margin: '0.5rem 0 0' }}>
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <div className="result-banner info">
            Real systems often use <b>several</b> databases, each for what it does best (“polyglot persistence”). Say why for each one.
          </div>
        </div>
      )}
    </Widget>
  );
}
