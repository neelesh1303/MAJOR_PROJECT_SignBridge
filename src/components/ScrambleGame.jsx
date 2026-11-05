import React, { useState, useEffect, useRef } from 'react';
import { loadDictionary } from '../utils/textToSigns';
import { burstFromElement } from './fx/confetti';
import { readStored, writeStored } from './fx/hooks';
import { UndoIcon, BulbIcon, SkipIcon, ArrowIcon, TrophyIcon, FlameIcon } from './fx/Icons';

const BEST_KEY = 'signbridge.scramble.best';

function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Words carry ids so repeated words ("you ... you") stay distinct tiles.
const toTiles = (words) => words.map((word, i) => ({ id: `${i}-${word}`, word }));

const ScrambleGame = () => {
  const [currentPhrase, setCurrentPhrase] = useState(null);
  const [scrambledWords, setScrambledWords] = useState([]);
  const [userAnswer, setUserAnswer] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [best, setBest] = useState(() => readStored(BEST_KEY, 0));
  const boardRef = useRef(null);

  const startGame = (dict) => {
    // Need phrases with more than 1 word and a gif
    const playablePhrases = dict.filter(entry => (entry.gif || entry.image) && entry.word.trim().split(' ').length > 1);

    if (playablePhrases.length === 0) {
      setMessage('No playable phrases found.');
      setIsLoading(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * playablePhrases.length);
    const selectedPhrase = playablePhrases[randomIndex];

    setCurrentPhrase(selectedPhrase);
    const words = toTiles(selectedPhrase.word.trim().split(' '));
    let shuffled = shuffleArray(words);
    if (words.length > 1 && shuffled.every((t, i) => t.id === words[i].id)) shuffled = [...shuffled].reverse();
    setScrambledWords(shuffled);
    setUserAnswer([]);
    setMessage('');
    setIsCorrect(false);
    setIsWrong(false);
    setHintsUsed(0);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDictionary().then(dict => {
      setData(dict);
      startGame(dict);
    });
  }, []);

  const checkAnswer = (answerTiles) => {
    if (!currentPhrase) return;
    const correctPhrase = currentPhrase.word.toLowerCase();
    const userPhrase = answerTiles.map((t) => t.word).join(' ').toLowerCase();

    if (userPhrase === correctPhrase) {
      const points = Math.max(5, answerTiles.length * 10 - hintsUsed * 8) * Math.min(streak + 1, 4);
      const nextScore = score + points;
      setMessage(`Correct! +${points}`);
      setIsCorrect(true);
      setIsWrong(false);
      setScore(nextScore);
      setStreak((s) => s + 1);
      if (nextScore > best) {
        setBest(nextScore);
        writeStored(BEST_KEY, nextScore);
      }
      burstFromElement(boardRef.current);
    } else {
      setMessage('Not quite — tap a word to send it back and try again.');
      setIsCorrect(false);
      setIsWrong(true);
      setStreak(0);
      setTimeout(() => setIsWrong(false), 500);
    }
  };

  const handleWordClick = (tile) => {
    if (isCorrect) return;
    const nextAnswer = [...userAnswer, tile];
    const nextBank = scrambledWords.filter((t) => t.id !== tile.id);
    setUserAnswer(nextAnswer);
    setScrambledWords(nextBank);
    setMessage('');
    if (nextBank.length === 0) checkAnswer(nextAnswer);
  };

  const returnWord = (tile) => {
    if (isCorrect) return;
    setUserAnswer((prev) => prev.filter((t) => t.id !== tile.id));
    setScrambledWords((prev) => [...prev, tile]);
    setMessage('');
  };

  const undoLast = () => {
    if (userAnswer.length === 0) return;
    returnWord(userAnswer[userAnswer.length - 1]);
  };

  // Places the next correct word for a small points cost.
  const applyHint = () => {
    if (!currentPhrase || isCorrect) return;
    const target = currentPhrase.word.trim().split(' ');
    let correctPrefix = 0;
    while (correctPrefix < userAnswer.length && userAnswer[correctPrefix].word === target[correctPrefix]) correctPrefix++;
    const kept = userAnswer.slice(0, correctPrefix);
    const pool = [...scrambledWords, ...userAnswer.slice(correctPrefix)];
    const nextWord = target[correctPrefix];
    const tile = pool.find((t) => t.word === nextWord);
    if (!tile) return;
    const nextAnswer = [...kept, tile];
    const nextBank = pool.filter((t) => t.id !== tile.id);
    setHintsUsed((h) => h + 1);
    setUserAnswer(nextAnswer);
    setScrambledWords(nextBank);
    setMessage('');
    if (nextBank.length === 0) checkAnswer(nextAnswer);
  };

  const resetGame = () => {
    startGame(data);
  };

  const skip = () => {
    setStreak(0);
    startGame(data);
  };

  if (isLoading) return <div className="game-loading"><span className="spinner" /> Loading game…</div>;

  return (
    <div className="game-shell">
      <div className="game-hud">
        <div className="game-stat"><span className="mono">SCORE</span><strong key={score} className="pop-in">{score}</strong></div>
        <div className={`game-stat game-stat--streak${streak >= 2 ? ' is-hot' : ''}`}>
          <span className="mono">STREAK</span>
          <strong><FlameIcon width="18" height="18" /> {streak}</strong>
        </div>
        <div className="game-stat"><span className="mono">HINTS</span><strong>{hintsUsed}</strong></div>
        <div className="game-stat"><span className="mono">BEST</span><strong><TrophyIcon width="17" height="17" /> {best}</strong></div>
      </div>

      <div ref={boardRef} className={`game-card-main glass-panel${isWrong ? ' shake' : ''}${isCorrect ? ' is-correct' : ''}`}>
        <div className="quiz-top">
          <div>
            <span className="eyebrow eyebrow--coral">Caption scramble</span>
            <h2 className="display quiz-title">Reorder the words to <em>match the sign.</em></h2>
          </div>
        </div>

        {currentPhrase && (
          <div className="quiz-media">
            <img key={currentPhrase.word} className="pop-in" src={currentPhrase.gif || currentPhrase.image} alt="Sign language hint" />
          </div>
        )}

        <div className="scramble-zone">
          <span className="mono scramble-label">Your answer</span>
          <div className={`scramble-slots${isCorrect ? ' is-solved' : ''}`}>
            {userAnswer.length === 0 && <span className="scramble-empty">Tap words below to build the caption</span>}
            {userAnswer.map((tile) => (
              <button key={tile.id} type="button" className="word-tile word-tile--placed pop-in" onClick={() => returnWord(tile)} disabled={isCorrect}>
                {tile.word}
              </button>
            ))}
          </div>
        </div>

        <div className="scramble-zone">
          <span className="mono scramble-label">Word bank</span>
          <div className="scramble-bank">
            {scrambledWords.map((tile, i) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleWordClick(tile)}
                className="word-tile pop-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {tile.word}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className={`scramble-message fade-up ${isCorrect ? 'is-good' : 'is-bad'}`}>{message}</p>
        )}

        <div className="scramble-actions">
          <button type="button" onClick={undoLast} disabled={userAnswer.length === 0 || isCorrect} className="btn">
            <UndoIcon /> Undo
          </button>
          <button type="button" onClick={applyHint} disabled={isCorrect} className="btn">
            <BulbIcon /> Hint
          </button>
          {!isCorrect ? (
            <button type="button" onClick={skip} className="btn btn--ghost"><SkipIcon /> Skip</button>
          ) : (
            <button type="button" onClick={resetGame} className="btn btn--primary">Next phrase <ArrowIcon /></button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrambleGame;
