import { useEffect, useState } from 'react';
import ArchFlow from './ArchFlow';
import { COMPONENTS, SCENARIOS } from '../../data/practice';

const TIERS: { id: string; label: string }[] = [
  { id: 'client', label: 'Clients' },
  { id: 'edge', label: 'Edge & entry' },
  { id: 'compute', label: 'Compute' },
  { id: 'data', label: 'Data' },
  { id: 'async', label: 'Async & analytics' },
];

const byId = Object.fromEntries(COMPONENTS.map((c) => [c.id, c]));

export default function DesignCanvas({ base = '/' }: { base?: string }) {
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [hint, setHint] = useState(0);
  const sc = SCENARIOS.find((s) => s.id === sid)!;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`sd-canvas-${sid}`) || '[]');
      setPicked(Array.isArray(saved) ? saved : []);
    } catch {
      setPicked([]);
    }
    setChecked(false);
    setShowRef(false);
    setHint(0);
  }, [sid]);

  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    setPicked(next);
    setChecked(false);
    try {
      localStorage.setItem(`sd-canvas-${sid}`, JSON.stringify(next));
    } catch {}
  };

  const mustIds = Object.keys(sc.must);
  const satisfied = (id: string) => picked.includes(id) || (!!sc.alt?.[id] && picked.includes(sc.alt[id]));
  const missing = mustIds.filter((id) => !satisfied(id));
  const goodPicked = picked.filter((id) => sc.good[id]);
  const overkillPicked = picked.filter((id) => sc.overkill[id]);
  const neutral = picked.filter((id) => !sc.must[id] && !sc.good[id] && !sc.overkill[id] && !Object.values(sc.alt ?? {}).includes(id));
  const score = Math.max(0, Math.round(((mustIds.length - missing.length) / mustIds.length) * 80 + Math.min(goodPicked.length, 3) * 7 - overkillPicked.length * 8));

  const refNodes = sc.reference.nodes.map((n) => ({ id: n.id, label: byId[n.id].label, sub: n.sub, icon: byId[n.id].icon, kind: byId[n.id].kind, x: n.x, y: n.y }));
  const refEdges = sc.reference.edges.map(([from, to, label]) => ({ from, to, label }));

  return (
    <div className="dc">
      <div className="dc-scenarios">
        {SCENARIOS.map((s) => (
          <button key={s.id} className={`dc-scn ${s.id === sid ? 'on' : ''}`} onClick={() => setSid(s.id)}>
            {s.title}
          </button>
        ))}
      </div>

      <div className="dc-prompt card">
        <div className="pill">Your task</div>
        <h3>Design: {sc.title}</h3>
        <p>{sc.prompt}</p>
        <div className="widget-controls" style={{ marginBottom: 0 }}>
          <button className="btn btn-sm" onClick={() => setHint(Math.min(sc.hints.length, hint + 1))} disabled={hint >= sc.hints.length}>
            💡 Hint ({hint}/{sc.hints.length})
          </button>
          {sc.hints.slice(0, hint).map((h) => (
            <span key={h} className="small dc-hint">
              {h}
            </span>
          ))}
        </div>
      </div>

      <div className="dc-grid">
        <div className="card dc-palette">
          <div className="box-title">Component palette (click to add / remove)</div>
          {TIERS.map((t) => (
            <div key={t.id} className="dc-tier">
              <div className="small muted">{t.label}</div>
              <div className="dc-chips">
                {COMPONENTS.filter((c) => c.tier === t.id).map((c) => (
                  <button key={c.id} className={`dc-chip ${picked.includes(c.id) ? 'on' : ''}`} onClick={() => toggle(c.id)}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card dc-canvas">
          <div className="box-title">Your design ({picked.length} components)</div>
          {picked.length === 0 && <div className="small muted">Start with the client, then add only what the requirements need.</div>}
          <div className="dc-lanes">
            {TIERS.map((t) => {
              const items = picked.filter((id) => byId[id].tier === t.id);
              if (!items.length) return null;
              return (
                <div key={t.id} className="dc-lane">
                  <div className="dc-lane-title">{t.label}</div>
                  {items.map((id) => {
                    const st = checked ? (sc.must[id] ? 'must' : sc.good[id] ? 'good' : sc.overkill[id] ? 'over' : 'neutral') : '';
                    return (
                      <div key={id} className={`dc-node fade-in ${st}`}>
                        <span>
                          {byId[id].icon} {byId[id].label}
                        </span>
                        <button onClick={() => toggle(id)} aria-label={`Remove ${byId[id].label}`}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="widget-controls" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => setChecked(true)} disabled={!picked.length}>
              ✓ Check my design
            </button>
            <button className="btn" onClick={() => setShowRef(!showRef)}>
              {showRef ? 'Hide' : 'Show'} reference design
            </button>
            <button className="btn" onClick={() => { setPicked([]); setChecked(false); try { localStorage.removeItem(`sd-canvas-${sid}`); } catch {} }}>
              ↺ Clear
            </button>
          </div>
        </div>
      </div>

      {checked && (
        <div className="card dc-feedback fade-in">
          <div className="dc-score">
            <span>{score}</span>/100
          </div>
          {missing.length > 0 && (
            <div className="dc-fb-block bad">
              <b>Missing essentials</b>
              {missing.map((id) => (
                <div key={id}>
                  {byId[id].icon} <b>{byId[id].label}</b>: {sc.must[id]}
                </div>
              ))}
            </div>
          )}
          {mustIds.length - missing.length > 0 && (
            <div className="dc-fb-block good">
              <b>Essentials you included</b>
              {mustIds
                .filter(satisfied)
                .map((id) => (
                  <div key={id}>
                    {byId[id].icon} <b>{byId[id].label}</b>: {sc.must[id]}
                  </div>
                ))}
            </div>
          )}
          {goodPicked.length > 0 && (
            <div className="dc-fb-block info">
              <b>Nice additions (if you can justify them)</b>
              {goodPicked.map((id) => (
                <div key={id}>
                  {byId[id].icon} <b>{byId[id].label}</b>: {sc.good[id]}
                </div>
              ))}
            </div>
          )}
          {overkillPicked.length > 0 && (
            <div className="dc-fb-block warn">
              <b>Probably unnecessary here (over-engineering)</b>
              {overkillPicked.map((id) => (
                <div key={id}>
                  {byId[id].icon} <b>{byId[id].label}</b>: {sc.overkill[id]}
                </div>
              ))}
            </div>
          )}
          {neutral.length > 0 && (
            <div className="small muted">
              Not part of the reference, but could be fine with a reason: {neutral.map((id) => byId[id].label).join(', ')}.
            </div>
          )}
          <div className="small" style={{ marginTop: 8 }}>
            Full walkthrough: <a href={`${base.replace(/\/$/, '')}/learn/${sc.lesson}`}>read the {sc.title} lesson →</a>
          </div>
        </div>
      )}

      {showRef && <ArchFlow title={`Reference design: ${sc.title}`} nodes={refNodes} edges={refEdges} height={430} width={960} />}
    </div>
  );
}
