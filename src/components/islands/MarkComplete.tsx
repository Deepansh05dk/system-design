import { useEffect, useState } from 'react';
import { getDone, setDone } from '../../lib/progress';

export default function MarkComplete({ id, nextHref }: { id: string; nextHref?: string }) {
  const [done, setLocal] = useState(false);
  useEffect(() => setLocal(getDone().includes(id)), [id]);
  const toggle = () => {
    setDone(id, !done);
    setLocal(!done);
  };
  return (
    <div className={`mark-complete ${done ? 'is-done' : ''}`}>
      <div>
        <div className="mc-title">{done ? '🎉 Lesson completed!' : 'Finished this lesson?'}</div>
        <div className="mc-sub">
          {done ? 'Your progress is saved in this browser.' : 'Mark it complete to track your progress.'}
        </div>
      </div>
      <div className="mc-actions">
        <button className={`btn ${done ? '' : 'btn-primary'}`} onClick={toggle}>
          {done ? '↺ Mark as not done' : '✓ Mark as complete'}
        </button>
        {done && nextHref && (
          <a className="btn btn-primary" href={nextHref}>
            Next lesson →
          </a>
        )}
      </div>
    </div>
  );
}
