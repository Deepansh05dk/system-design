import { useEffect, useMemo, useState } from 'react';
import { flashcards } from '../../data/flashcards';

export default function Flashcards({ deck, title = 'Trade-off flashcards' }: { deck?: string; title?: string }) {
  const decks = useMemo(() => [...new Set(flashcards.map((c) => c.deck))], []);
  const [active, setActive] = useState<string>(deck ?? 'All');
  const cards = useMemo(() => flashcards.filter((c) => active === 'All' || c.deck === active), [active]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);

  useEffect(() => {
    try {
      setKnown(JSON.parse(localStorage.getItem('sd-flash-known') || '[]'));
    } catch {}
  }, []);

  const card = cards[i % cards.length];
  const go = (d: number) => {
    setFlipped(false);
    setI((x) => (x + d + cards.length) % cards.length);
  };
  const mark = (k: boolean) => {
    const next = k ? [...new Set([...known, card.q])] : known.filter((x) => x !== card.q);
    setKnown(next);
    try {
      localStorage.setItem('sd-flash-known', JSON.stringify(next));
    } catch {}
    go(1);
  };
  const knownHere = cards.filter((c) => known.includes(c.q)).length;

  return (
    <div className="widget fc">
      <div className="widget-head">
        <span className="tag">Flashcards</span>
        <span>{title}</span>
      </div>
      <div className="widget-body">
        {!deck && (
          <div className="widget-controls">
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {['All', ...decks].map((d) => (
                <button key={d} className={active === d ? 'on' : ''} onClick={() => { setActive(d); setI(0); setFlipped(false); }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="small muted" style={{ marginBottom: 8 }}>
          Card {(i % cards.length) + 1} of {cards.length} · You know {knownHere}/{cards.length}
        </div>
        <button className={`fc-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label="Flip card">
          <div className="fc-inner">
            <div className="fc-face fc-front">
              <span className="pill">{card.deck}</span>
              <div className="fc-q">{card.q}</div>
              <div className="small muted">Think of your answer, then tap to flip</div>
            </div>
            <div className="fc-face fc-back">
              <div className="fc-a">{card.a}</div>
            </div>
          </div>
        </button>
        <div className="widget-controls" style={{ justifyContent: 'center', marginTop: 10 }}>
          <button className="btn" onClick={() => go(-1)}>
            ◀ Prev
          </button>
          <button className="btn" onClick={() => mark(false)}>
            🔁 Review again
          </button>
          <button className="btn btn-primary" onClick={() => mark(true)}>
            ✓ I knew it
          </button>
          <button className="btn" onClick={() => go(1)}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}
