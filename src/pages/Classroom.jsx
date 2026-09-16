import React, { useState, useEffect, useRef } from 'react';
import SignToText from '../components/SignToText';
import { createSpeechRecognition } from '../services/speechService';
import { translateTextToSigns } from '../utils/textToSigns';

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
  const [teacherText, setTeacherText] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [signSequence, setSignSequence] = useState([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms per sign
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    recognitionRef.current = createSpeechRecognition(
      (final, interim) => {
        if (final) {
          setTeacherText(prev => (prev ? prev + ' ' + final : final).trim());
        }
        setInterimText(interim);
      },
      (err) => {
        if (err.error !== 'no-speech') {
          setError(`Microphone error: ${err.error}`);
          setIsListening(false);
        }
      },
      () => {
        setIsListening(false);
      }
    );

    if (!recognitionRef.current) {
      setError("This browser does not support speech recognition. Try Chrome or Edge, or use the text box below.");
    }
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setError('Could not start microphone');
      }
    }
  };

  // Convert text to signs when teacher text updates
  useEffect(() => {
    if (!teacherText) {
      setSignSequence([]);
      setCurrentSignIndex(0);
      setIsPlaying(false);
      return;
    }
    
    const translate = async () => {
      const signs = await translateTextToSigns(teacherText);
      setSignSequence(signs);
      setCurrentSignIndex(0);
      if (signs.length > 0) {
        setIsPlaying(true); // Autoplay sequence on new sentence
      }
    };
    translate();
  }, [teacherText]);

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
    setTeacherText('');
    setTypedInput('');
    setInterimText('');
    setSignSequence([]);
    setCurrentSignIndex(0);
    setIsPlaying(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (typedInput.trim()) {
      setTeacherText(typedInput.trim());
    }
  };

  const handlePresetClick = (phrase) => {
    setTypedInput(phrase);
    setTeacherText(phrase);
  };

  const currentSign = signSequence[currentSignIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-[calc(100vh-64px)]">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inclusive Classroom</h1>
          <p className="text-gray-600 mt-1">Communicate seamlessly using Speech, Text, and Indian Sign Language (ISL).</p>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6 min-h-0">
        
        {/* Teacher Panel */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
              <span>🎙️</span> Teacher Panel: Speech to ISL
            </h2>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
              Full Phrases + Fingerspelling
            </span>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Speech control & Clear */}
            <div className="flex gap-2">
              <button 
                onClick={toggleListening}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition shadow-sm flex items-center justify-center gap-2 ${
                  isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span>{isListening ? '🛑' : '🎤'}</span>
                {isListening ? 'Stop Speaking' : 'Start Speaking'}
              </button>
              <button 
                onClick={clearTeacherText} 
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
              >
                Clear
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-400">Quick Test:</span>
              {PRESET_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(phrase)}
                  className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200 transition"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Manual text input */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input 
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Or type any sentence to convert to ISL..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                className="px-3 py-2 bg-gray-800 hover:bg-black text-white text-sm font-semibold rounded-lg transition"
              >
                Translate
              </button>
            </form>

            {/* Live Transcription Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Active Text
              </label>
              <div className="text-base text-gray-800 font-medium min-h-[30px]">
                {teacherText} <span className="text-blue-500 italic">{interimText}</span>
                {!teacherText && !interimText && (
                  <span className="text-gray-400 italic font-normal">Speak or type words to generate signs...</span>
                )}
              </div>
            </div>

            {/* ISL Main Stage Viewer */}
            <div className="border-t border-gray-100 pt-3 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <span>🤟</span> ISL Visual Translation
                  {signSequence.length > 0 && (
                    <span className="text-xs font-normal text-gray-500">
                      ({currentSignIndex + 1} of {signSequence.length} signs)
                    </span>
                  )}
                </label>
                
                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200"
                  >
                    <option value={1800}>0.7x Speed</option>
                    <option value={1200}>1.0x Speed</option>
                    <option value={700}>1.5x Speed</option>
                  </select>

                  <button 
                    onClick={handlePrev}
                    disabled={currentSignIndex === 0 || signSequence.length === 0}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-30"
                    title="Previous Sign"
                  >
                    ⏮
                  </button>
                  <button 
                    onClick={handlePlayPause}
                    disabled={signSequence.length === 0}
                    className="text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded disabled:opacity-30"
                  >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={currentSignIndex >= signSequence.length - 1 || signSequence.length === 0}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-30"
                    title="Next Sign"
                  >
                    ⏭
                  </button>
                </div>
              </div>

              {/* Display Area */}
              <div className="bg-gray-900 rounded-xl flex flex-col items-center justify-center p-4 relative min-h-[220px]">
                {currentSign ? (
                  <div className="flex flex-col items-center animate-fadeIn">
                    <img 
                      src={currentSign.value} 
                      alt={currentSign.label}
                      className="h-44 max-w-full object-contain rounded-lg bg-white p-2 shadow-lg"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-white font-bold text-xl uppercase tracking-wider">
                        {currentSign.label}
                      </span>
                      {currentSign.isFingerspelled ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase">
                          Spelling "{currentSign.wordGroup}" ({currentSign.letterIndex + 1}/{currentSign.letterTotal})
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase">
                          Full Phrase
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center flex flex-col items-center gap-2">
                    <span className="text-3xl">🤲</span>
                    <span>Speak or type to generate sign language animations</span>
                  </div>
                )}
              </div>

              {/* Sequence Filmstrip / Timeline */}
              {signSequence.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-400 mb-1.5 flex justify-between">
                    <span>Full Sentence Sequence:</span>
                    <span>Click any sign to preview</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {signSequence.map((sign, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSign(idx)}
                        className={`flex-shrink-0 flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                          idx === currentSignIndex
                            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/50'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-80'
                        }`}
                      >
                        <img 
                          src={sign.value} 
                          alt={sign.label}
                          className="w-12 h-12 object-contain bg-white rounded border border-gray-100 p-0.5"
                        />
                        <span className="text-[11px] font-bold text-gray-800 mt-1 uppercase">
                          {sign.label}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {sign.isFingerspelled ? 'Letter' : 'Phrase'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Student Panel */}
        <SignToText />

      </div>
    </div>
  );
};

export default Classroom;

