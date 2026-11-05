import React, { useState } from 'react';
import Quiz from '../components/Quiz';
import ScrambleGame from '../components/ScrambleGame';
import TiltCard from '../components/fx/TiltCard';
import Reveal from '../components/fx/Reveal';
import { readStored } from '../components/fx/hooks';
import { ArrowIcon, QuestionIcon, ShuffleIcon, TrophyIcon, FlameIcon } from '../components/fx/Icons';
import './Games.css';

const GAMES = [
  {
    id: 'quiz',
    title: 'ISL Quiz',
    body: 'Watch the sign, pick the meaning. Beat the clock and chain answers for a streak multiplier.',
    icon: QuestionIcon,
    tone: 'mint',
    bestKey: 'signbridge.quiz.best',
    tiles: ['?', 'A', 'B', 'C'],
  },
  {
    id: 'scramble',
    title: 'Caption Scramble',
    body: 'A phrase is signed and its caption is jumbled. Put the words back in the right order.',
    icon: ShuffleIcon,
    tone: 'coral',
    bestKey: 'signbridge.scramble.best',
    tiles: ['take', 'care', 'nice', 'to'],
  },
];

const Games = () => {
  const [activeGame, setActiveGame] = useState('hub');

  if (activeGame !== 'hub') {
    return (
      <div className="page games-play">
        <button type="button" onClick={() => setActiveGame('hub')} className="btn btn--ghost games-back">
          <ArrowIcon style={{ transform: 'rotate(180deg)' }} /> Back to games
        </button>
        {activeGame === 'quiz' ? <Quiz /> : <ScrambleGame />}
      </div>
    );
  }

  return (
    <div className="page games">
      <Reveal className="page-head page-head--center">
        <span className="eyebrow eyebrow--coral">Practice arcade</span>
        <h1 className="display">Learn by <em>playing.</em></h1>
        <p className="lead">Short, replayable games that build confidence with Indian Sign Language, one sign at a time.</p>
      </Reveal>

      <div className="games-grid">
        {GAMES.map((game, i) => {
          const GIcon = game.icon;
          const best = readStored(game.bestKey, 0);
          return (
            <Reveal key={game.id} delay={i * 120} variant="scale">
              <TiltCard
                as="button"
                type="button"
                className={`game-card glass-panel tone-${game.tone}`}
                onClick={() => setActiveGame(game.id)}
                max={7}
              >
                <span className="game-card-art" aria-hidden="true">
                  {game.tiles.map((t, k) => <span key={t} style={{ '--k': k }}>{t}</span>)}
                </span>
                <span className="game-card-top">
                  <span className="game-icon"><GIcon /></span>
                  <span className="game-best mono"><TrophyIcon width="14" height="14" /> Best {best}</span>
                </span>
                <span className="game-card-copy">
                  <span className="game-title">{game.title}</span>
                  <span className="game-body">{game.body}</span>
                  <span className="game-play">Play now <ArrowIcon /></span>
                </span>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={200} className="games-tip">
        <FlameIcon width="18" height="18" /> Tip: in the quiz, press <kbd>1</kbd>–<kbd>4</kbd> to answer and <kbd>Enter</kbd> for the next question.
      </Reveal>
    </div>
  );
};

export default Games;
