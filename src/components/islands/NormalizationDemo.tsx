import { useState } from 'react';
import Widget from './Widget';

const ORDERS = [
  { id: 1, item: 'Keyboard' },
  { id: 2, item: 'Mouse' },
  { id: 3, item: 'Monitor' },
  { id: 4, item: 'Webcam' },
];

export default function NormalizationDemo() {
  const [mode, setMode] = useState<'denorm' | 'norm'>('denorm');
  const [email, setEmail] = useState('asha@old.com');
  const [updated, setUpdated] = useState<number | null>(null);
  const [partial, setPartial] = useState(false);

  const change = (simulateBug: boolean) => {
    setEmail('asha@new.com');
    setUpdated(mode === 'denorm' ? 4 : 1);
    setPartial(simulateBug && mode === 'denorm');
  };
  const reset = () => {
    setEmail('asha@old.com');
    setUpdated(null);
    setPartial(false);
  };

  return (
    <Widget title="Update Asha’s email in both designs" tag="Interactive">
      <div className="widget-controls">
        <div className="seg">
          <button className={mode === 'denorm' ? 'on' : ''} onClick={() => { setMode('denorm'); reset(); }}>
            Denormalized (one table)
          </button>
          <button className={mode === 'norm' ? 'on' : ''} onClick={() => { setMode('norm'); reset(); }}>
            Normalized (two tables)
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => change(false)}>
          ✉️ Change email
        </button>
        {mode === 'denorm' && (
          <button className="btn btn-danger" onClick={() => change(true)}>
            💥 Change email, but app crashes halfway
          </button>
        )}
        <button className="btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      {mode === 'denorm' ? (
        <div className="box">
          <div className="box-title">orders (customer info copied into every row)</div>
          <table className="sim-table">
            <thead>
              <tr>
                <th>order_id</th>
                <th>item</th>
                <th>customer</th>
                <th>customer_email</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o, i) => {
                const stale = partial && i >= 2;
                const val = updated ? (stale ? 'asha@old.com' : email) : 'asha@old.com';
                return (
                  <tr key={o.id} className={updated ? (stale ? 'bad' : 'good') : ''}>
                    <td>{o.id}</td>
                    <td>{o.item}</td>
                    <td>Asha</td>
                    <td>{val}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="two-col">
          <div className="box">
            <div className="box-title">customers</div>
            <table className="sim-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>name</th>
                  <th>email</th>
                </tr>
              </thead>
              <tbody>
                <tr className={updated ? 'good' : ''}>
                  <td>7</td>
                  <td>Asha</td>
                  <td>{email}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="box">
            <div className="box-title">orders</div>
            <table className="sim-table">
              <thead>
                <tr>
                  <th>order_id</th>
                  <th>item</th>
                  <th>customer_id</th>
                </tr>
              </thead>
              <tbody>
                {ORDERS.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.item}</td>
                    <td>7</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {updated !== null && (
        <div className={`result-banner ${partial ? 'bad' : mode === 'norm' ? 'good' : 'warn'}`}>
          {partial
            ? '✗ Update anomaly! Some rows have the new email, some the old. Which one is true? The data now contradicts itself.'
            : mode === 'norm'
              ? '✓ 1 row updated. The fact is stored once, so it can never disagree with itself. (Reading orders with email now needs a JOIN.)'
              : `⚠️ ${updated} rows had to be updated for one fact. Works, but more writes and more chances for inconsistency. (Reads are fast though: no JOIN.)`}
        </div>
      )}
    </Widget>
  );
}
