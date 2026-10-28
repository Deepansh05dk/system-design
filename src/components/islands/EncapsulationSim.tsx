import { useState, type ReactElement } from 'react';
import Widget from './Widget';

const LAYERS = [
  { name: 'Application', proto: 'HTTP', header: 'GET /index.html', color: 'var(--k-service)', adds: 'The actual message your app wants to send. HTTP, DNS, SMTP live here. This is the layer you work with as a web developer.' },
  { name: 'Transport', proto: 'TCP', header: 'src port 51234 → dst port 443 · seq #1', color: 'var(--k-lb)', adds: 'Adds ports (which program should receive it) and sequence numbers (to put packets back in order and detect loss).' },
  { name: 'Network', proto: 'IP', header: 'from 192.168.1.5 → to 54.239.28.85', color: 'var(--k-queue)', adds: 'Adds source and destination IP addresses so routers across the internet can forward it hop by hop.' },
  { name: 'Link', proto: 'Wi-Fi / Ethernet', header: 'MAC aa:bb → router cc:dd', color: 'var(--k-db)', adds: 'Adds hardware (MAC) addresses to reach the next device on the local network, e.g. your Wi-Fi router.' },
];

export default function EncapsulationSim() {
  const [depth, setDepth] = useState(1);
  const shown = LAYERS.slice(0, depth);

  const render = (i: number): ReactElement => {
    const l = shown[i];
    const inner = i === 0 ? null : render(i - 1);
    return (
      <div className="enc-box fade-in" style={{ borderColor: l.color, background: `color-mix(in srgb, ${l.color} 9%, var(--surface))` }} key={l.name}>
        <div className="enc-head" style={{ color: l.color }}>
          {l.proto} header <span className="muted">({l.header})</span>
        </div>
        {inner ?? <div className="enc-payload">📄 &lt;html&gt;… your page …&lt;/html&gt;</div>}
      </div>
    );
  };

  return (
    <Widget title="Wrapping a message, layer by layer" tag="Interactive">
      <div className="widget-controls">
        <button className="btn" onClick={() => setDepth(Math.max(1, depth - 1))} disabled={depth === 1}>
          ⬆ Unwrap (receiver side)
        </button>
        <button className="btn btn-primary" onClick={() => setDepth(Math.min(4, depth + 1))} disabled={depth === 4}>
          ⬇ Pass down one layer
        </button>
      </div>
      <div className="enc-wrap">
        <div className="enc-stack">
          {LAYERS.map((l, i) => (
            <div key={l.name} className={`enc-layer ${i < depth ? 'on' : ''}`} style={{ borderLeftColor: l.color }}>
              <b>
                L{[7, 4, 3, 2][i]} · {l.name}
              </b>
              <span className="muted small"> {l.proto}</span>
            </div>
          ))}
        </div>
        <div className="enc-visual">{render(shown.length - 1)}</div>
      </div>
      <div className="result-banner info">
        <b>{shown[shown.length - 1].name} layer:</b> {shown[shown.length - 1].adds}
      </div>
    </Widget>
  );
}
