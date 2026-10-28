import { useState } from 'react';
import Widget from './Widget';

const STRATS = [
  { name: 'Backup & restore', icon: '💾', rpo: 'hours (since last backup)', rto: 'hours to a day', cost: 1, rpoScore: 1, rtoScore: 1, desc: 'Regular backups/snapshots copied to another region. On disaster, build everything from scratch and restore data.' },
  { name: 'Pilot light', icon: '🕯️', rpo: 'minutes', rto: 'tens of minutes', cost: 2, rpoScore: 3, rtoScore: 2, desc: 'Data is continuously replicated to the second region, and a minimal core (the database) runs there. App servers are started only during a disaster.' },
  { name: 'Warm standby', icon: '🔥', rpo: 'seconds to minutes', rto: 'minutes', cost: 3, rpoScore: 4, rtoScore: 4, desc: 'A scaled-down but fully working copy of the system runs in the second region. On disaster, scale it up and switch traffic.' },
  { name: 'Multi-region active-active', icon: '🌍', rpo: '~zero', rto: '~zero (seconds)', cost: 5, rpoScore: 5, rtoScore: 5, desc: 'Both regions serve real traffic all the time. If one fails, the other absorbs its users. Hardest: data must sync across regions and conflicts must be handled.' },
];

function Bar({ v, color }: { v: number; color: string }) {
  return (
    <div className="meter" style={{ height: 8 }}>
      <div style={{ width: `${v * 20}%`, background: color }} />
    </div>
  );
}

export default function DrStrategySim() {
  const [i, setI] = useState(1);
  const s = STRATS[i];
  return (
    <Widget title="Disaster recovery strategies: what you get, what you pay" tag="Compare">
      <div className="widget-controls">
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          {STRATS.map((x, j) => (
            <button key={x.name} className={j === i ? 'on' : ''} onClick={() => setI(j)}>
              {x.icon} {x.name}
            </button>
          ))}
        </div>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">How it works</div>
          <div className="small">{s.desc}</div>
        </div>
        <div className="box">
          <div className="small">
            <b>RPO</b> (data you could lose): {s.rpo}
          </div>
          <Bar v={s.rpoScore} color="var(--good)" />
          <div className="small" style={{ marginTop: 8 }}>
            <b>RTO</b> (time to recover): {s.rto}
          </div>
          <Bar v={s.rtoScore} color="var(--good)" />
          <div className="small" style={{ marginTop: 8 }}>
            <b>Cost & complexity</b>
          </div>
          <Bar v={s.cost} color="var(--bad)" />
        </div>
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>Green bars: longer = better protection. Red bar: longer = more expensive.</div>
    </Widget>
  );
}
