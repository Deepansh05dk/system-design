import { useState } from 'react';
import Widget from './Widget';

type Style = 'rest' | 'graphql' | 'grpc';

const REST = [
  { req: 'GET /users/7', bytes: 1200, note: 'returns 25 fields, the screen needs 2 (overfetching)' },
  { req: 'GET /users/7/posts?limit=3', bytes: 4800, note: 'full post objects, needs only titles' },
  { req: 'GET /users/7/followers/count', bytes: 90, note: 'one more round trip' },
];

const GQL = `query ProfileCard {
  user(id: 7) {
    name
    avatarUrl
    followersCount
    posts(last: 3) { title }
  }
}`;

export default function ApiStyleSim() {
  const [style, setStyle] = useState<Style>('rest');
  const [rtt, setRtt] = useState(150);

  const reqs = style === 'rest' ? 3 : 1;
  const bytes = style === 'rest' ? REST.reduce((s, r) => s + r.bytes, 0) : style === 'graphql' ? 620 : 210;
  // REST: first call needed to know user, then 2 parallel calls → 2 sequential round trips
  const roundTrips = style === 'rest' ? 2 : 1;
  const time = roundTrips * rtt + Math.round(bytes / 50);

  return (
    <Widget title="Fetch a profile card: name, avatar, follower count, last 3 post titles" tag="Compare">
      <div className="widget-controls">
        <div className="seg">
          <button className={style === 'rest' ? 'on' : ''} onClick={() => setStyle('rest')}>
            REST
          </button>
          <button className={style === 'graphql' ? 'on' : ''} onClick={() => setStyle('graphql')}>
            GraphQL
          </button>
          <button className={style === 'grpc' ? 'on' : ''} onClick={() => setStyle('grpc')}>
            gRPC
          </button>
        </div>
        <label>
          Network round trip: <b>{rtt} ms</b> (mobile 4G ≈ 100–200)
          <input type="range" min={10} max={300} step={10} value={rtt} onChange={(e) => setRtt(+e.target.value)} />
        </label>
      </div>
      {style === 'rest' && (
        <div className="api-calls">
          {REST.map((r, i) => (
            <div key={r.req} className="api-call fade-in" style={{ animationDelay: `${i * 120}ms` }}>
              <code>{r.req}</code>
              <span className="pill pill-warn">{(r.bytes / 1000).toFixed(1)} KB</span>
              <span className="small muted">{r.note}</span>
            </div>
          ))}
        </div>
      )}
      {style === 'graphql' && (
        <div className="two-col">
          <pre style={{ margin: 0 }}>{GQL}</pre>
          <div className="small">
            <p style={{ marginTop: 0 }}>
              <b>One</b> <code>POST /graphql</code> request. The client lists exactly the fields it needs; the server returns exactly that shape (~0.6 KB).
            </p>
            <p className="muted">The GraphQL server still calls the user, post and follower services behind the scenes, but those calls happen inside the data center, where round trips cost ~0.5 ms instead of {rtt} ms.</p>
          </div>
        </div>
      )}
      {style === 'grpc' && (
        <div className="two-col">
          <pre style={{ margin: 0 }}>{`service ProfileService {
  rpc GetProfileCard (ProfileRequest)
      returns (ProfileCard);
}
message ProfileCard {
  string name = 1;
  string avatar_url = 2;
  int64 followers_count = 3;
  repeated string post_titles = 4;
}`}</pre>
          <div className="small">
            <p style={{ marginTop: 0 }}>
              A typed method call over HTTP/2. The payload is <b>binary Protocol Buffers</b> (~0.2 KB): field numbers instead of field names, compact numbers.
            </p>
            <p className="muted">Browsers can’t call gRPC directly without a proxy (gRPC-Web). It shines <b>between backend services</b>.</p>
          </div>
        </div>
      )}
      <div className="stat-row">
        <div className="stat">
          <div className="v">{reqs}</div>
          <div className="l">HTTP requests</div>
        </div>
        <div className="stat">
          <div className="v">{roundTrips}</div>
          <div className="l">Sequential round trips</div>
        </div>
        <div className="stat">
          <div className="v">{(bytes / 1000).toFixed(1)} KB</div>
          <div className="l">Data transferred</div>
        </div>
        <div className="stat">
          <div className="v">~{time} ms</div>
          <div className="l">Rough load time</div>
        </div>
      </div>
    </Widget>
  );
}
