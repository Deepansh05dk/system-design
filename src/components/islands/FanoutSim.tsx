import { useState } from 'react';
import Widget from './Widget';

type Mode = 'push' | 'pull' | 'hybrid';

const INFO: Record<Mode, { name: string; desc: string }> = {
  push: { name: 'Fan-out on write (push)', desc: 'When someone posts, write the post ID into EVERY follower’s precomputed timeline (a Redis list). Reading a timeline is one fast lookup.' },
  pull: { name: 'Fan-out on read (pull)', desc: 'Posting is just one write. When someone opens their timeline, fetch recent posts from everyone they follow and merge them on the fly.' },
  hybrid: { name: 'Hybrid', desc: 'Push for normal users. For celebrities (say > 100K followers), don’t push; their posts are pulled and merged at read time.' },
};

export default function FanoutSim() {
  const [mode, setMode] = useState<Mode>('push');
  const [followers, setFollowers] = useState(300);
  const [celebrity, setCelebrity] = useState(false);
  const [following, setFollowing] = useState(200);

  const authorFollowers = celebrity ? 50_000_000 : followers;
  const isCeleb = authorFollowers > 100_000;
  const celebsFollowed = 3;

  let writeOps = 1;
  let readOps = 1;
  let delayNote = '';
  if (mode === 'push') {
    writeOps = 1 + authorFollowers;
    readOps = 1;
    delayNote = authorFollowers > 1_000_000 ? `Delivering to ${authorFollowers.toLocaleString()} timelines takes minutes; some followers see the post very late.` : 'Followers see it within seconds.';
  } else if (mode === 'pull') {
    writeOps = 1;
    readOps = following;
    delayNote = 'Posts appear instantly, but every timeline open does a big multi-user query.';
  } else {
    writeOps = isCeleb ? 1 : 1 + authorFollowers;
    readOps = 1 + celebsFollowed;
    delayNote = isCeleb ? 'Celebrity post: 1 write. Followers merge it in at read time (a few extra reads).' : 'Normal user: pushed to followers’ timelines as usual.';
  }

  const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);

  return (
    <Widget title="One post, many timelines: who pays the cost?" tag="Simulator">
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(INFO) as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {INFO[m].name}
            </button>
          ))}
        </div>
      </div>
      <div className="result-banner info" style={{ marginTop: 0, marginBottom: 10 }}>
        {INFO[mode].desc}
      </div>
      <div className="widget-controls">
        <label>
          Author’s followers: <b>{fmt(authorFollowers)}</b>
          <input type="range" min={10} max={5000} step={10} value={followers} disabled={celebrity} onChange={(e) => setFollowers(+e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={celebrity} onChange={(e) => setCelebrity(e.target.checked)} /> ⭐ Author is a celebrity (50M followers)
        </label>
        <label>
          Reader follows: <b>{following}</b> accounts
          <input type="range" min={10} max={2000} step={10} value={following} onChange={(e) => setFollowing(+e.target.value)} />
        </label>
      </div>
      <div className="fo-stage">
        <div className="fo-author">{celebrity ? '⭐' : '👤'} Author posts</div>
        <div className="fo-fans">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className={`fo-dot ${mode === 'push' || (mode === 'hybrid' && !isCeleb) ? 'on' : ''}`} style={{ animationDelay: `${(i % 12) * 40}ms` }} />
          ))}
          <div className="small muted" style={{ width: '100%' }}>
            {mode === 'push' || (mode === 'hybrid' && !isCeleb) ? `Writing to ${fmt(authorFollowers)} follower timelines…` : 'Nothing pushed. Followers will pull at read time.'}
          </div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="v" style={{ color: writeOps > 1_000_000 ? 'var(--bad)' : writeOps > 1000 ? 'var(--warn)' : 'var(--good)' }}>{fmt(writeOps)}</div>
          <div className="l">Writes for this one post</div>
        </div>
        <div className="stat">
          <div className="v" style={{ color: readOps > 100 ? 'var(--bad)' : 'var(--good)' }}>{fmt(readOps)}</div>
          <div className="l">Lookups per timeline open</div>
        </div>
      </div>
      <div className={`result-banner ${mode === 'hybrid' ? 'good' : 'warn'}`}>{delayNote}</div>
    </Widget>
  );
}
