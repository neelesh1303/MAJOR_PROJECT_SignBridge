import React, { useState, useEffect, useRef } from 'react';
import SignToText from '../components/SignToText';
import VoiceVisualizer from '../components/fx/VoiceVisualizer';
import Segmented from '../components/fx/Segmented';
import Reveal from '../components/fx/Reveal';
import {
  MicIcon, StopIcon, PlayIcon, PauseIcon, PrevIcon, NextIcon, ReplayIcon, TrashIcon, ArrowIcon,
} from '../components/fx/Icons';
import './Classroom.css';
import { createSpeechRecognition, getSpeechRecognitionErrorMessage } from '../services/speechService';
import { translateTextToSigns } from '../utils/textToSigns';

const SPEED_OPTIONS = [
  { value: 1800, label: '0.7×' },
  { value: 1200, label: '1×' },
  { value: 700, label: '1.5×' },
  { value: 600, label: '2×' },
];

const PRESET_PHRASES = [
  "Hello",
  "Good morning",
  "I love you",
  "What is your name",
  "Sign language interpreter",
  "Thank you"
];

const Classroom = () => {
  // Teacher State
  const [isListening, setIsListening] = useState(false);
  const [isStartingListening, setIsStartingListening] = useState(false);
  const [teacherText, setTeacherText] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [signSequence, setSignSequence] = useState([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms per sign
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  const speechTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const speechTranslationTimerRef = useRef(null);
  const translationRequestRef = useRef(0);
  const [translationText, setTranslationText] = useState('');
  
  useEffect(() => {
    recognitionRef.current = createSpeechRecognition(
      (final, interim) => {
        if (final || interim.trim()) setError('');
        if (final) {
          speechTranscriptRef.current = [speechTranscriptRef.current, final].filter(Boolean).join(' ').trim();
          setTeacherText(speechTranscriptRef.current);
        }
        interimTranscriptRef.current = interim;
        setInterimText(interim);

        if ((final || interim.trim()) && (speechTranscriptRef.current || interim.trim())) {
          clearTimeout(speechTranslationTimerRef.current);
          speechTranslationTimerRef.current = setTimeout(() => {
            speechTranslationTimerRef.current = null;
            const spokenText = [speechTranscriptRef.current, interimTranscriptRef.current]
              .filter(Boolean)
              .join(' ')
              .trim();
            if (spokenText) setTranslationText(spokenText);
          }, 1500);
        }
      },
      (err) => {
        if (err.error === 'no-speech') {
          setError(getSpeechRecognitionErrorMessage(err));
        } else if (err.error !== 'aborted') {
          setError(getSpeechRecognitionErrorMessage(err));
          setIsListening(false);
        }
      },
      () => {
        setIsListening(false);
        if (!speechTranslationTimerRef.current && (speechTranscriptRef.current || interimTranscriptRef.current)) {
          speechTranslationTimerRef.current = setTimeout(() => {
            speechTranslationTimerRef.current = null;
            const spokenText = [speechTranscriptRef.current, interimTranscriptRef.current]
              .filter(Boolean)
              .join(' ')
              .trim();
            if (spokenText) setTranslationText(spokenText);
          }, 1500);
        }
      }
    );

    if (!recognitionRef.current) {
      setError("This browser does not support speech recognition. Try Chrome or Edge, or use the text box below.");
    }
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      clearTimeout(speechTranslationTimerRef.current);
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (isStartingListening) return;
      setError('');
      if (!recognitionRef.current) {
        setError('Speech recognition is not supported in this browser. Try Chrome or Edge, or use the text box below.');
        return;
      }
      speechTranscriptRef.current = teacherText;
      interimTranscriptRef.current = '';
      setIsStartingListening(true);
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
          microphone.getTracks().forEach(track => track.stop());
        }
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setError(getSpeechRecognitionErrorMessage(err));
        setIsListening(false);
      } finally {
        setIsStartingListening(false);
      }
    }
  };

  // Convert typed text immediately and spoken text after a short pause.
  useEffect(() => {
    const requestId = ++translationRequestRef.current;
    if (!translationText) {
      setSignSequence([]);
      setCurrentSignIndex(0);
      setIsPlaying(false);
      return;
    }
    
    const translate = async () => {
      const signs = await translateTextToSigns(translationText);
      if (requestId !== translationRequestRef.current) return;
      setSignSequence(signs);
      setCurrentSignIndex(0);
      if (signs.length > 0) {
        setIsPlaying(true); // Autoplay sequence on new sentence
      }
    };
    translate();
  }, [translationText]);

  // Sign playback timer
  useEffect(() => {
    if (isPlaying && signSequence.length > 0) {
      const timer = setTimeout(() => {
        if (currentSignIndex < signSequence.length - 1) {
          setCurrentSignIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeed);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentSignIndex, signSequence.length, playbackSpeed]);

  const handlePlayPause = () => {
    if (signSequence.length === 0) return;
    if (currentSignIndex >= signSequence.length - 1 && !isPlaying) {
      setCurrentSignIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleReplay = () => {
    if (signSequence.length === 0) return;
    setCurrentSignIndex(0);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (currentSignIndex < signSequence.length - 1) {
      setCurrentSignIndex(prev => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentSignIndex > 0) {
      setCurrentSignIndex(prev => prev - 1);
      setIsPlaying(false);
    }
  };

  const handleSelectSign = (index) => {
    setCurrentSignIndex(index);
    setIsPlaying(false);
  };

  const clearTeacherText = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    clearTimeout(speechTranslationTimerRef.current);
    speechTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setTeacherText('');
    setTypedInput('');
    setInterimText('');
    setTranslationText('');
    setSignSequence([]);
    setCurrentSignIndex(0);
    setIsPlaying(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (typedInput.trim()) {
      clearTimeout(speechTranslationTimerRef.current);
      speechTranscriptRef.current = typedInput.trim();
      interimTranscriptRef.current = '';
      setTeacherText(typedInput.trim());
      setInterimText('');
      setTranslationText(typedInput.trim());
    }
  };

  const handlePresetClick = (phrase) => {
    clearTimeout(speechTranslationTimerRef.current);
    speechTranscriptRef.current = phrase;
    interimTranscriptRef.current = '';
    setTypedInput(phrase);
    setTeacherText(phrase);
    setInterimText('');
    setTranslationText(phrase);
  };


  const currentSign = signSequence[currentSignIndex] || null;
  const orbRef = useRef(null);
  const filmRef = useRef(null);

  const handleLevel = (level) => {
    orbRef.current?.style.setProperty('--level', level.toFixed(3));
  };

  useEffect(() => {
    const strip = filmRef.current;
    const card = strip?.children[currentSignIndex];
    if (strip && card) {
      strip.scrollTo({ left: card.offsetLeft - strip.clientWidth / 2 + card.clientWidth / 2, behavior: 'smooth' });
    }
  }, [currentSignIndex, signSequence]);

  const micState = isListening ? 'listening' : isStartingListening ? 'starting' : 'idle';

  return (
    <div className="page classroom">
      <Reveal className="page-head classroom-head">
        <span className="eyebrow">Inclusive classroom · live session</span>
        <h1 className="display">One room. <em>Every language.</em></h1>
        <p className="lead">Teachers speak or type and students see ISL. Students sign to the camera and everyone reads, or hears, what they said.</p>
      </Reveal>

      <div className="classroom-grid">
        {/* Teacher Panel */}
        <Reveal as="section" variant="left" className="studio glass-panel tone-coral" aria-label="Teacher panel: speech to ISL">
          <header className="studio-head">
            <span className="studio-badge"><MicIcon /></span>
            <div>
              <span className="studio-kicker mono">Teacher</span>
              <h2>Speech → ISL</h2>
            </div>
            <span className="tag tag--coral studio-tag">Phrases + fingerspelling</span>
          </header>

          <div className="studio-body">
            {error && <div className="notice fade-up">{error}</div>}

            <div className={`mic-row is-${micState}`}>
              <button
                ref={orbRef}
                type="button"
                onClick={toggleListening}
                disabled={isStartingListening}
                className="mic-orb"
                aria-pressed={isListening}
                aria-label={isListening ? 'Stop speaking' : 'Start speaking'}
              >
                <span className="mic-orb-ring" />
                <span className="mic-orb-ring mic-orb-ring--2" />
                <span className="mic-orb-core">{isListening ? <StopIcon /> : <MicIcon />}</span>
              </button>
              <div className="mic-copy">
                <strong>
                  {isListening ? 'Listening…' : isStartingListening ? 'Allow microphone access…' : 'Tap to start speaking'}
                </strong>
                <span>Spoken words translate after a 1.5 second pause.</span>
                <VoiceVisualizer active={isListening} onLevel={handleLevel} />
              </div>
              <button type="button" onClick={clearTeacherText} className="btn btn--sm mic-clear">
                <TrashIcon /> Clear
              </button>
            </div>

            <div className="preset-row">
              <span className="mono preset-label">Quick test</span>
              {PRESET_PHRASES.map((phrase, idx) => (
                <button key={idx} type="button" onClick={() => handlePresetClick(phrase)} className="chip">
                  {phrase}
                </button>
              ))}
            </div>

            <form onSubmit={handleManualSubmit} className="field type-field">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Or type any sentence to convert to ISL…"
                aria-label="Sentence to convert to ISL"
              />
              <button type="submit" className="btn btn--primary btn--sm">Translate <ArrowIcon /></button>
            </form>

            <div className={`transcript${isListening ? ' is-live' : ''}`}>
              <span className="mono transcript-label">Active text</span>
              <p>
                {teacherText} <span className="transcript-interim">{interimText}</span>
                {isListening && <span className="caret" aria-hidden="true" />}
                {!teacherText && !interimText && !isListening && (
                  <span className="transcript-empty">Speak or type words to generate signs…</span>
                )}
              </p>
            </div>

            <div className="stage">
              <div className="stage-bar">
                <span className="stage-title">
                  ISL visual translation
                  {signSequence.length > 0 && (
                    <span className="mono stage-count">{currentSignIndex + 1}/{signSequence.length}</span>
                  )}
                </span>
                <Segmented options={SPEED_OPTIONS} value={playbackSpeed} onChange={setPlaybackSpeed} label="Playback speed" />
              </div>

              {signSequence.length > 0 && (
                <div className="stage-progress" aria-hidden="true">
                  {signSequence.map((_, idx) => (
                    <span
                      key={idx}
                      className={idx < currentSignIndex ? 'is-done' : idx === currentSignIndex ? (isPlaying ? 'is-playing' : 'is-current') : ''}
                    >
                      <i style={{ animationDuration: `${playbackSpeed}ms` }} key={`${idx}-${currentSignIndex}-${isPlaying}`} />
                    </span>
                  ))}
                </div>
              )}

              <div className="stage-screen">
                <div className="hud-grid" />
                {currentSign ? (
                  <figure key={`${currentSignIndex}-${currentSign.label}`} className="stage-figure pop-in">
                    <img src={currentSign.value} alt={currentSign.label} />
                    <figcaption>
                      <strong>{currentSign.label}</strong>
                      {currentSign.isFingerspelled ? (
                        <span className="tag tag--amber">
                          Spelling “{currentSign.wordGroup}” · {currentSign.letterIndex + 1}/{currentSign.letterTotal}
                        </span>
                      ) : (
                        <span className="tag tag--mint">Full phrase</span>
                      )}
                    </figcaption>
                  </figure>
                ) : (
                  <div className="stage-empty">
                    <span className="stage-empty-icon">🤲</span>
                    <span>Speak or type to generate sign language animations</span>
                  </div>
                )}
              </div>

              <div className="stage-controls">
                <button type="button" className="btn btn--icon" onClick={handlePrev} disabled={currentSignIndex === 0 || signSequence.length === 0} aria-label="Previous sign"><PrevIcon /></button>
                <button type="button" className="btn btn--primary stage-play" onClick={handlePlayPause} disabled={signSequence.length === 0}>
                  {isPlaying ? <><PauseIcon /> Pause</> : <><PlayIcon /> Play</>}
                </button>
                <button type="button" className="btn btn--icon" onClick={handleNext} disabled={currentSignIndex >= signSequence.length - 1 || signSequence.length === 0} aria-label="Next sign"><NextIcon /></button>
                <button type="button" className="btn btn--icon" onClick={handleReplay} disabled={signSequence.length === 0} aria-label="Replay from start"><ReplayIcon /></button>
              </div>

              {signSequence.length > 0 && (
                <div className="filmstrip-wrap">
                  <div className="mono filmstrip-label"><span>Full sentence sequence</span><span>Click any sign to preview</span></div>
                  <div className="filmstrip" ref={filmRef}>
                    {signSequence.map((sign, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSign(idx)}
                        className={`film-card${idx === currentSignIndex ? ' is-active' : ''}${idx < currentSignIndex ? ' is-past' : ''}`}
                        style={{ animationDelay: `${Math.min(idx, 20) * 30}ms` }}
                      >
                        <img src={sign.value} alt={sign.label} />
                        <span className="film-label">{sign.label}</span>
                        <span className="film-kind">{sign.isFingerspelled ? 'Letter' : 'Phrase'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Student Panel */}
        <Reveal variant="right" delay={120} className="classroom-student">
          <SignToText />
        </Reveal>
      </div>
    </div>
  );
};

export default Classroom;
