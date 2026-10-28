import { useEffect, useState } from 'react';
import { getQuizScore, saveQuizScore } from '../../lib/progress';

export interface Question {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export default function Quiz({
  id,
  questions,
  title = 'Check your understanding',
}: {
  id: string;
  questions: Question[];
  title?: string;
}) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [best, setBest] = useState<{ score: number; total: number } | null>(null);
  useEffect(() => setBest(getQuizScore(id)), [id]);

  const answered = picked.filter((p) => p !== null).length;
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const finished = answered === questions.length;

  useEffect(() => {
    if (finished) {
      saveQuizScore(id, score, questions.length);
      setBest(getQuizScore(id));
    }
  }, [finished]);

  const choose = (qi: number, oi: number) => {
    if (picked[qi] !== null) return;
    setPicked((p) => p.map((v, i) => (i === qi ? oi : v)));
  };
  const reset = () => setPicked(questions.map(() => null));
  const pct = Math.round((score / questions.length) * 100);

  return (
    <section className="quiz">
      <div className="quiz-head">
        <div>
          <div className="quiz-kicker">🧠 Quiz</div>
          <div className="quiz-title">{title}</div>
        </div>
        <div className="quiz-progress">
          {answered}/{questions.length} answered
          {best && <span className="pill" style={{ marginLeft: 8 }}>Best: {best.score}/{best.total}</span>}
        </div>
      </div>
      {questions.map((qq, qi) => {
        const p = picked[qi];
        return (
          <div className="quiz-q" key={qi}>
            <div className="quiz-qtext">
              <span className="quiz-num">{qi + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: qq.q }} />
            </div>
            <div className="quiz-opts">
              {qq.options.map((o, oi) => {
                let cls = 'quiz-opt';
                if (p !== null) {
                  if (oi === qq.answer) cls += ' correct';
                  else if (oi === p) cls += ' wrong';
                  else cls += ' dim';
                }
                return (
                  <button key={oi} className={cls} onClick={() => choose(qi, oi)} disabled={p !== null}>
                    <span className="quiz-letter">{String.fromCharCode(65 + oi)}</span>
                    <span dangerouslySetInnerHTML={{ __html: o }} />
                  </button>
                );
              })}
            </div>
            {p !== null && (
              <div className={`quiz-explain ${p === qq.answer ? 'ok' : 'no'}`}>
                <strong>{p === qq.answer ? '✓ Correct! ' : '✗ Not quite. '}</strong>
                <span dangerouslySetInnerHTML={{ __html: qq.explain }} />
              </div>
            )}
          </div>
        );
      })}
      {finished && (
        <div className="quiz-result">
          <div className="quiz-score">
            {score}/{questions.length} <span>({pct}%)</span>
          </div>
          <div>
            {pct === 100
              ? '🏆 Perfect! You really get this.'
              : pct >= 70
                ? '👍 Good job. Read the explanations for the ones you missed.'
                : '📚 Worth re-reading the lesson, then try again.'}
          </div>
          <button className="btn" onClick={reset}>
            ↺ Try again
          </button>
        </div>
      )}
    </section>
  );
}
