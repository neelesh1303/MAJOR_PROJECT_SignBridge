import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadDictionary } from '../utils/textToSigns';
import { speakText } from '../services/speechService';
import TiltCard from '../components/fx/TiltCard';
import Reveal from '../components/fx/Reveal';
import {
  SearchIcon, CloseIcon, SpeakerIcon, PrevIcon, NextIcon, ArrowIcon, ShuffleIcon,
} from '../components/fx/Icons';
import './Learn.css';

const PLACEHOLDERS = ['Search “good morning”…', 'Try “mango”…', 'Look up a letter like “K”…', 'Find “take care”…'];

const categoryOf = (entry) => {
  if (entry.word.length === 1) return 'letters';
  if (entry.word.includes(' ')) return 'phrases';
  return 'words';
};

const CATEGORY_LABEL = { phrases: 'Phrase', words: 'Word', letters: 'Letter' };
const CATEGORY_TONE = { phrases: 'mint', words: 'sky', letters: 'amber' };

const SignModal = ({ entries, index, onClose, onMove }) => {
  const entry = entries[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove(1);
      if (e.key === 'ArrowLeft') onMove(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onMove]);

  if (!entry) return null;
  const category = categoryOf(entry);

  return (
    <div className="sign-modal" role="dialog" aria-modal="true" aria-label={`Sign for ${entry.word}`} onClick={onClose}>
      <div className="sign-modal-card glass-panel glass-panel--glow" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn btn--icon sign-modal-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        <div key={entry.word} className="sign-modal-media pop-in">
          <img src={entry.gif || entry.image} alt={`ISL sign for ${entry.word}`} />
        </div>
        <div className="sign-modal-info">
          <span className={`tag tag--${CATEGORY_TONE[category]}`}>{CATEGORY_LABEL[category]}</span>
          <h2 className="display">{entry.word}</h2>
          {entry.examples?.[0] && !entry.examples[0].startsWith('Example for') && (
            <p><span className="mono">EXAMPLE</span>{entry.examples[0]}</p>
          )}
          <div className="sign-modal-actions">
            <button type="button" className="btn" onClick={() => speakText(entry.word)}><SpeakerIcon /> Hear it</button>
            <Link className="btn btn--primary" to="/classroom">Practice in classroom <ArrowIcon /></Link>
          </div>
          <div className="sign-modal-nav">
            <button type="button" className="btn btn--icon" onClick={() => onMove(-1)} aria-label="Previous sign"><PrevIcon /></button>
            <span className="mono">{index + 1} / {entries.length}</span>
            <button type="button" className="btn btn--icon" onClick={() => onMove(1)} aria-label="Next sign"><NextIcon /></button>
            <span className="sign-modal-keys mono">← → to browse · esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Learn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dictionary, setDictionary] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [placeholder, setPlaceholder] = useState(0);

  useEffect(() => {
    const fetchDict = async () => {
      const data = await loadDictionary();
      // Present phrases first, then words, then the alphabet in order.
      const order = { phrases: 0, words: 1, letters: 2 };
      setDictionary([...data].sort((a, b) =>
        order[categoryOf(a)] - order[categoryOf(b)] || a.word.localeCompare(b.word)));
      setLoading(false);
    };
    fetchDict();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setPlaceholder((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const updateSearch = (value) => {
    setSearchTerm(value);
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const counts = useMemo(() => {
    const c = { all: dictionary.length, phrases: 0, words: 0, letters: 0 };
    dictionary.forEach((e) => { c[categoryOf(e)] += 1; });
    return c;
  }, [dictionary]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return dictionary.filter((entry) =>
      (category === 'all' || categoryOf(entry) === category) &&
      (!term ||
        entry.word.toLowerCase().includes(term) ||
        (entry.examples && entry.examples.some((ex) => ex.toLowerCase().includes(term)))));
  }, [dictionary, searchTerm, category]);

  const handleMove = useCallback((step) => {
    setOpenIndex((i) => (i === null ? i : (i + step + filtered.length) % filtered.length));
  }, [filtered.length]);

  const handleClose = useCallback(() => setOpenIndex(null), []);

  const surprise = () => {
    if (filtered.length) setOpenIndex(Math.floor(Math.random() * filtered.length));
  };

  return (
    <div className="page learn">
      <Reveal className="page-head page-head--center">
        <span className="eyebrow">ISL dictionary</span>
        <h1 className="display">Learn <em>Indian Sign Language.</em></h1>
        <p className="lead">Browse commonly used phrases, words and the fingerspelling alphabet. Tap any sign to see it up close.</p>
      </Reveal>

      <Reveal delay={100} className="learn-controls">
        <label className="field learn-search">
          <SearchIcon />
          <input
            type="text"
            placeholder={PLACEHOLDERS[placeholder]}
            value={searchTerm}
            onChange={(e) => updateSearch(e.target.value)}
            aria-label="Search signs, phrases and examples"
          />
          {searchTerm && (
            <button type="button" className="btn btn--icon btn--ghost" onClick={() => updateSearch('')} aria-label="Clear search"><CloseIcon /></button>
          )}
        </label>

        <div className="learn-filters">
          {[
            ['all', 'All'],
            ['phrases', 'Phrases'],
            ['words', 'Words'],
            ['letters', 'Letters'],
          ].map(([key, label]) => (
            <button key={key} type="button" className={`chip${category === key ? ' is-active' : ''}`} onClick={() => setCategory(key)}>
              {label} <span className="count">{counts[key]}</span>
            </button>
          ))}
          <button type="button" className="chip learn-surprise" onClick={surprise} disabled={!filtered.length}>
            <ShuffleIcon width="14" height="14" /> Surprise me
          </button>
        </div>
      </Reveal>

      {loading ? (
        <div className="learn-grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="learn-skeleton" />)}
        </div>
      ) : (
        <>
          <p className="learn-result mono" aria-live="polite">
            {filtered.length} sign{filtered.length === 1 ? '' : 's'}{searchTerm ? ` matching “${searchTerm}”` : ''}
          </p>
          {filtered.length > 0 ? (
            <div className="learn-grid" key={`${category}-${searchTerm}`}>
              {filtered.map((entry, idx) => {
                const cat = categoryOf(entry);
                return (
                  <TiltCard
                    as="button"
                    type="button"
                    key={entry.word}
                    className={`learn-card glass-panel tone-${CATEGORY_TONE[cat]}`}
                    style={{ animationDelay: `${Math.min(idx, 24) * 28}ms` }}
                    onClick={() => setOpenIndex(idx)}
                    max={7}
                  >
                    <span className="learn-card-media">
                      <img src={entry.gif || entry.image} alt={entry.word} loading="lazy" />
                    </span>
                    <span className="learn-card-body">
                      <span className="learn-card-word">{entry.word}</span>
                      <span className={`tag tag--${CATEGORY_TONE[cat]}`}>{CATEGORY_LABEL[cat]}</span>
                    </span>
                  </TiltCard>
                );
              })}
            </div>
          ) : (
            <div className="learn-empty glass-panel">
              <span>🤷</span>
              <p>No signs found for “{searchTerm}”.</p>
              <span className="learn-empty-hint">Words without a sign are fingerspelled in the classroom.</span>
              <Link className="btn btn--primary" to="/classroom">Fingerspell it in the classroom <ArrowIcon /></Link>
            </div>
          )}
        </>
      )}

      {openIndex !== null && (
        <SignModal entries={filtered} index={openIndex} onClose={handleClose} onMove={handleMove} />
      )}
    </div>
  );
};

export default Learn;
