import { useEffect, useRef, useState } from 'react';
import Widget from './Widget';

interface Attempt {
  send: number;
  arrive: number;
  lost: boolean;
}
interface Pkt {
  seq: number;
  ch: string;
  attempts: Attempt[];
}

const MESSAGE = 'HELLO WORLD!';
const TIMEOUT = 16;

function plan(loss: number, reliable: boolean, rand: () => number = Math.random): Pkt[] {
  return MESSAGE.split('').map((ch, seq) => {
    const attempts: Attempt[] = [];
    let send = seq * 2;
    for (let k = 0; k < 6; k++) {
      const travel = 8 + Math.floor(rand() * 7);
      const lost = k < 5 && rand() < loss;
      attempts.push({ send, arrive: send + travel, lost });
      if (!lost || !reliable) break;
      send = send + TIMEOUT;
    }
    return { seq, ch, attempts };
  });
}

function Lane({ name, pkts, t, reliable }: { name: string; pkts: Pkt[]; t: number; reliable: boolean }) {
  const arrived = pkts
    .map((p) => {
      const ok = p.attempts.find((a) => !a.lost);
      return ok && ok.arrive <= t ? { p, at: ok.arrive } : null;
    })
    .filter(Boolean) as { p: Pkt; at: number }[];
  const got = new Set(arrived.map((a) => a.p.seq));
  let prefix = 0;
  while (got.has(prefix)) prefix++;
  const byArrival = [...arrived].sort((a, b) => a.at - b.at);
  const lostCount = pkts.filter((p) => p.attempts.every((a) => a.lost)).length;
  const retrans = pkts.reduce((s, p) => s + p.attempts.length - 1, 0);
  const lastEvent = Math.max(...pkts.flatMap((p) => p.attempts.map((a) => a.arrive)));
  const finished = t >= lastEvent;

  return (
    <div className="pk-lane">
      <div className="pk-lane-head">
        <strong>{name}</strong>
        <span className="muted small">{reliable ? 'reliable · ordered · slower' : 'fast · no guarantees'}</span>
      </div>
      <div className="pk-track">
        <div className="pk-end left">📤 Sender</div>
        <div className="pk-end right">📥 Receiver</div>
        {pkts.flatMap((p) =>
          p.attempts.map((a, ai) => {
            if (t < a.send) return null;
            const frac = Math.min(1, (t - a.send) / (a.arrive - a.send));
            if (a.lost && frac > 0.55) {
              if (t - a.send > (a.arrive - a.send) * 1.2) return null;
              return (
                <span key={`${p.seq}-${ai}`} className="pk-pkt lost" style={{ left: `calc(12% + 0.55 * 70%)`, top: 4 + p.seq * 15 }}>
                  💥
                </span>
              );
            }
            if (frac >= 1) return null;
            return (
              <span key={`${p.seq}-${ai}`} className={`pk-pkt ${ai > 0 ? 'retry' : ''}`} style={{ left: `calc(12% + ${frac} * 70%)`, top: 4 + p.seq * 15 }}>
                {p.ch === ' ' ? '␣' : p.ch}
              </span>
            );
          }),
        )}
      </div>
      <div className="pk-out">
        <div>
          <span className="muted small">App receives: </span>
          <code className="pk-msg">
            {reliable
              ? MESSAGE.slice(0, prefix).replace(/ /g, '␣') || '…'
              : byArrival.map((a) => (a.p.ch === ' ' ? '␣' : a.p.ch)).join('') || '…'}
          </code>
        </div>
        {reliable && arrived.length > prefix && (
          <div className="small muted">
            Waiting in buffer (out of order): {arrived.filter((a) => a.p.seq >= prefix).map((a) => a.p.ch).join(' ')}
          </div>
        )}
        {finished && (
          <div className={`result-banner ${reliable ? 'good' : lostCount ? 'bad' : 'good'}`}>
            {reliable
              ? `✓ Complete & in order. Finished at t=${lastEvent}. Retransmissions: ${retrans}.`
              : `${lostCount ? `✗ ${lostCount} packet(s) lost forever.` : '✓ Nothing lost this time.'} Finished at t=${lastEvent}. Order may be mixed.`}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PacketSim() {
  const [loss, setLoss] = useState(0.25);
  const [tcp, setTcp] = useState<Pkt[]>(() => plan(0, true, () => 0.5));
  const [udp, setUdp] = useState<Pkt[]>(() => plan(0, false, () => 0.5));
  const [t, setT] = useState(999);
  const timer = useRef<number | null>(null);

  const end = Math.max(...[...tcp, ...udp].flatMap((p) => p.attempts.map((a) => a.arrive)));

  useEffect(() => {
    if (t >= end) return;
    timer.current = window.setTimeout(() => setT((v) => v + 1), 110);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [t, end]);

  const send = () => {
    setTcp(plan(loss, true));
    setUdp(plan(loss, false));
    setT(0);
  };

  return (
    <Widget title="Send “HELLO WORLD!” over TCP and UDP" tag="Simulator">
      <div className="widget-controls">
        <label>
          Packet loss: <strong>{Math.round(loss * 100)}%</strong>
          <input type="range" min={0} max={0.6} step={0.05} value={loss} onChange={(e) => setLoss(+e.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={send}>
          ▶ Send message
        </button>
        <span className="muted small">t = {Math.min(t, end)}</span>
      </div>
      <Lane name="TCP" pkts={tcp} t={t} reliable />
      <Lane name="UDP" pkts={udp} t={t} reliable={false} />
      <p className="small muted" style={{ margin: '0.6rem 0 0' }}>
        Try 0% loss, then 40%. Notice TCP always delivers the full message in order, but takes longer when packets get
        lost (it waits, then resends). UDP finishes fast but the message may have holes or be scrambled.
      </p>
    </Widget>
  );
}
