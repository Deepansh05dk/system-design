import { useState } from 'react';
import Widget from './Widget';

const USERS = [
  { id: 1, name: 'Asha', city: 'Pune' },
  { id: 2, name: 'Ravi', city: 'Delhi' },
  { id: 3, name: 'Meera', city: 'Chennai' },
  { id: 4, name: 'Karan', city: 'Mumbai' },
];
const ORDERS = [
  { id: 101, user_id: 1, item: 'Keyboard', amount: 1999 },
  { id: 102, user_id: 3, item: 'Monitor', amount: 12999 },
  { id: 103, user_id: 1, item: 'Mouse', amount: 799 },
  { id: 104, user_id: 2, item: 'Laptop stand', amount: 1499 },
];

type Mode = 'inner' | 'left' | 'filter';

export default function JoinVisualizer() {
  const [mode, setMode] = useState<Mode>('inner');
  const [hoverUser, setHoverUser] = useState<number | null>(null);

  const sql: Record<Mode, string> = {
    inner: `SELECT users.name, orders.item, orders.amount
FROM users
JOIN orders ON orders.user_id = users.id;`,
    left: `SELECT users.name, orders.item, orders.amount
FROM users
LEFT JOIN orders ON orders.user_id = users.id;`,
    filter: `SELECT users.name, SUM(orders.amount) AS total
FROM users
JOIN orders ON orders.user_id = users.id
GROUP BY users.name
HAVING SUM(orders.amount) > 2000;`,
  };

  let rows: { uid: number; cells: (string | number | null)[] }[] = [];
  let cols: string[] = [];
  if (mode === 'inner' || mode === 'left') {
    cols = ['name', 'item', 'amount'];
    for (const u of USERS) {
      const os = ORDERS.filter((o) => o.user_id === u.id);
      if (os.length) os.forEach((o) => rows.push({ uid: u.id, cells: [u.name, o.item, o.amount] }));
      else if (mode === 'left') rows.push({ uid: u.id, cells: [u.name, null, null] });
    }
  } else {
    cols = ['name', 'total'];
    for (const u of USERS) {
      const total = ORDERS.filter((o) => o.user_id === u.id).reduce((s, o) => s + o.amount, 0);
      if (total > 2000) rows.push({ uid: u.id, cells: [u.name, total] });
    }
  }

  return (
    <Widget title="Two tables, linked by a key" tag="Playground">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'inner' ? 'on' : ''} onClick={() => setMode('inner')}>
            JOIN
          </button>
          <button className={mode === 'left' ? 'on' : ''} onClick={() => setMode('left')}>
            LEFT JOIN
          </button>
          <button className={mode === 'filter' ? 'on' : ''} onClick={() => setMode('filter')}>
            GROUP BY + SUM
          </button>
        </div>
        <span className="small muted">Hover a user to see their matching orders.</span>
      </div>
      <div className="two-col">
        <div className="box">
          <div className="box-title">users</div>
          <table className="sim-table">
            <thead>
              <tr>
                <th>id 🔑</th>
                <th>name</th>
                <th>city</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.id} className={hoverUser === u.id ? 'hl' : ''} onMouseEnter={() => setHoverUser(u.id)} onMouseLeave={() => setHoverUser(null)}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="box">
          <div className="box-title">orders</div>
          <table className="sim-table">
            <thead>
              <tr>
                <th>id 🔑</th>
                <th>user_id 🔗</th>
                <th>item</th>
                <th>amount</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.id} className={hoverUser === o.user_id ? 'hl' : ''}>
                  <td>{o.id}</td>
                  <td>{o.user_id}</td>
                  <td>{o.item}</td>
                  <td>{o.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <pre style={{ margin: '0.8rem 0' }}>{sql[mode]}</pre>
      <div className="box">
        <div className="box-title">Result ({rows.length} rows)</div>
        <table className="sim-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`fade-in ${hoverUser === r.uid ? 'hl' : ''}`}>
                {r.cells.map((c, j) => (
                  <td key={j}>{c === null ? <span className="muted">NULL</span> : c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="result-banner info">
        {mode === 'inner' && 'JOIN keeps only users that have at least one matching order. Karan has no orders, so he is missing.'}
        {mode === 'left' && 'LEFT JOIN keeps every user. Where there is no matching order, the order columns are NULL (Karan).'}
        {mode === 'filter' && 'The database groups rows per user, adds up amounts, then filters. Doing this inside the DB is much faster than fetching everything into your app.'}
      </div>
    </Widget>
  );
}
