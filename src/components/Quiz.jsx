import React, { useState, useEffect, useRef, useCallback } from "react";
import { loadDictionary } from '../utils/textToSigns';
import { burstFromElement } from './fx/confetti';
import { readStored, writeStored } from './fx/hooks';
import { CheckIcon, CloseIcon, ArrowIcon, FlameIcon, TrophyIcon } from './fx/Icons';

const QUESTION_SECONDS = 15;
const BEST_KEY = 'signbridge.quiz.best';

export default function Quiz() {
  const [data, setData] = useState([]);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => readStored(BEST_KEY, 0));
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [gained, setGained] = useState(0);
  const cardRef = useRef(null);

  const generateQuestion = useCallback((dictData) => {
    if (dictData.length < 4) return;

    const entry = dictData[Math.floor(Math.random() * dictData.length)];
    const correctWord = entry.word;

    let wrongOptions = dictData
      .filter((d) => d.word !== correctWord)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((d) => d.word);

    let allOptions = [...wrongOptions, correctWord].sort(
      () => 0.5 - Math.random()
    );

    setQuestion(entry);
    setOptions(allOptions);
    setAnswer(null);
    setChosen(null);
    setTimeLeft(QUESTION_SECONDS);
  }, []);

  useEffect(() => {
    loadDictionary().then(dict => {
      // Letters are hard to tell apart in a 4-way pick, so quiz on words and phrases.
      const valid = dict.filter(d => (d.gif || d.image) && d.word.length > 1);
      setData(valid);
      generateQuestion(valid);
    });
  }, [generateQuestion]);

  const handleAnswer = useCallback((opt) => {
    if (answer || !question) return;
    setChosen(opt);
    const isCorrect = opt === question.word;
    setAnswer(isCorrect ? "correct" : "wrong");
    setAttempted((prev) => prev + 1);
    if (isCorrect) {
      const nextStreak = streak + 1;
      const points = (10 + timeLeft) * Math.min(nextStreak, 5);
      const nextScore = score + points;
      setGained(points);
      setStreak(nextStreak);
      setScore(nextScore);
      setCorrectCount((c) => c + 1);
      if (nextScore > best) {
        setBest(nextScore);
        writeStored(BEST_KEY, nextScore);
      }
      burstFromElement(cardRef.current, { count: 90 + Math.min(nextStreak, 5) * 20 });
    } else {
      setGained(0);
      setStreak(0);
    }
  }, [answer, question, streak, timeLeft, score, best]);

  // Countdown — running out counts as a miss.
  useEffect(() => {
    if (!question || answer) return;
    if (timeLeft <= 0) {
      handleAnswer('__timeout__');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, question, answer, handleAnswer]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) handleAnswer(options[n - 1]);
      if (e.key === 'Enter' && answer) generateQuestion(data);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, answer, data, handleAnswer, generateQuestion]);

  if (!question) return <div className="game-loading"><span className="spinner" /> Loading quiz…</div>;

  const ringLength = 2 * Math.PI * 22;
  const accuracy = attempted ? Math.round((correctCount / attempted) * 100) : 0;

  return (
    <div className="game-shell">
      <div className="game-hud">
        <div className="game-stat"><span className="mono">SCORE</span><strong key={score} className="pop-in">{score}</strong></div>
        <div className={`game-stat game-stat--streak${streak >= 2 ? ' is-hot' : ''}`}>
          <span className="mono">STREAK</span>
          <strong><FlameIcon width="18" height="18" /> {streak}{streak >= 2 && <small>×{Math.min(streak, 5)}</small>}</strong>
        </div>
        <div className="game-stat"><span className="mono">ACCURACY</span><strong>{accuracy}%</strong></div>
        <div className="game-stat"><span className="mono">BEST</span><strong><TrophyIcon width="17" height="17" /> {best}</strong></div>
      </div>

      <div ref={cardRef} className={`game-card-main glass-panel${answer === 'wrong' ? ' shake' : ''}${answer === 'correct' ? ' is-correct' : ''}`}>
        <div className="quiz-top">
          <div>
            <span className="eyebrow">Question {attempted + (answer ? 0 : 1)}</span>
            <h2 className="display quiz-title">What does this sign <em>mean?</em></h2>
          </div>
          <div className={`quiz-timer${timeLeft <= 5 && !answer ? ' is-low' : ''}`} aria-label={`${timeLeft} seconds left`}>
            <svg viewBox="0 0 50 50">
              <circle className="track" cx="25" cy="25" r="22" />
              <circle
                className="value"
                cx="25"
                cy="25"
                r="22"
                strokeDasharray={ringLength}
                strokeDashoffset={ringLength * (1 - timeLeft / QUESTION_SECONDS)}
              />
            </svg>
            <b className="mono">{timeLeft}</b>
          </div>
        </div>

        <div className="quiz-media">
          <img key={question.word} className="pop-in" src={question.gif || question.image} alt="Sign to identify" />
          {answer === 'correct' && <span className="quiz-gain pop-in">+{gained}</span>}
        </div>

        <div className="quiz-options">
          {options.map((opt, i) => {
            let state = '';
            if (answer) {
              if (opt === question.word) state = ' is-right';
              else if (opt === chosen) state = ' is-wrong';
              else state = ' is-dim';
            }
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswer(opt)}
                disabled={!!answer}
                className={`quiz-option${state}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="quiz-key mono">{i + 1}</span>
                <span className="quiz-option-text">{opt}</span>
                {state === ' is-right' && <CheckIcon className="quiz-mark" />}
                {state === ' is-wrong' && <CloseIcon className="quiz-mark" />}
              </button>
            );
          })}
        </div>

        {answer && (
          <div className="quiz-feedback fade-up">
            <span className={answer === 'correct' ? 'is-good' : 'is-bad'}>
              {answer === 'correct'
                ? streak >= 3 ? `On fire — ${streak} in a row!` : 'Nice — that’s right!'
                : chosen === '__timeout__' ? `Time’s up! It was “${question.word}”.` : `Not quite — it was “${question.word}”.`}
            </span>
            <button type="button" onClick={() => generateQuestion(data)} className="btn btn--primary">
              Next question <ArrowIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
