import React, { useEffect, useRef, useState } from 'react';
import { speakText } from '../services/speechService';

// Standard MediaPipe hand landmark connection lines
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [0, 17]
];

const ISL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => ({ label: l, value: l }));

const ISL_WORDS = [
  { label: "🙏 Namaste / Welcome", value: "NAMASTE" },
  { label: "🤝 Help", value: "HELP" },
  { label: "📖 Book", value: "BOOK" },
  { label: "🏠 House", value: "HOUSE" },
  { label: "🙌 Thank You", value: "THANK YOU" },
  { label: "🌅 Good Morning", value: "GOOD MORNING" },
  { label: "🌐 All", value: "ALL" },
  { label: "📅 August", value: "AUGUST" },
  { label: "🍌 Banana", value: "BANANA" },
  { label: "⚠️ Be Careful", value: "BE CAREFUL" },
  { label: "🎄 Christmas", value: "CHRISTMAS" },
  { label: "⛪ Church", value: "CHURCH" },
  { label: "🎉 Dasara", value: "DASARA" },
  { label: "❄️ December", value: "DECEMBER" },
  { label: "🛑 Stop", value: "STOP" },
];

const PRESET_GESTURES = [
  { label: "👋 Hello", value: "HELLO" },
  { label: "👍 Good", value: "GOOD" },
  { label: "👎 Bad", value: "BAD" },
  { label: "🤟 I Love You", value: "I LOVE YOU" },
  { label: "✌️ Peace / V", value: "V" },
  { label: "☝️ You", value: "YOU" },
  { label: "👌 OK", value: "OK" },
  { label: "🤙 Call Me / Y", value: "Y" },
  { label: "📐 L Sign", value: "L" },
];

const SignToText = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [predictedSentence, setPredictedSentence] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [isTwoHandedSign, setIsTwoHandedSign] = useState(false);
  const [handPredictions, setHandPredictions] = useState([]);
  const [handDetected, setHandDetected] = useState(false);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState(null);
  const [activeTab, setActiveTab] = useState('vowels_letters');
  const [copied, setCopied] = useState(false);
  
  const isPredictingRef = useRef(false);
  const timerRef = useRef(null);
  const predictionHistory = useRef([]);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
        setError('');
      }
    } catch (err) {
      console.error("Camera error", err);
      setError('Camera access denied or unavailable. You can use the Quick Test sign buttons below.');
    }
  };

  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setHandDetected(false);
    setCurrentPrediction(null);
    setHandPredictions([]);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Draw multi-hand landmarks & cross-hand interaction beam onto canvas overlay
  const drawLandmarks = (hands, interaction, width, height) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (!hands || hands.length === 0) return;

    // 1. Draw each hand's skeleton
    hands.forEach((hand, handIndex) => {
      const landmarks = hand.landmarks;
      if (!landmarks || landmarks.length < 21) return;
      
      // Right hand: Emerald Green, Left hand: Vibrant Amber
      const color = handIndex === 0 ? '#10b981' : '#f59e0b';
      const jointColor = handIndex === 0 ? '#34d399' : '#fbbf24';

      // Draw bone connections
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = landmarks[startIdx];
        const p2 = landmarks[endIdx];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      });

      // Draw landmark joints
      landmarks.forEach((pt, i) => {
        const isFingertip = [4, 8, 12, 16, 20].includes(i);
        ctx.fillStyle = isFingertip ? '#38bdf8' : jointColor;
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, i === 0 ? 6 : (isFingertip ? 5 : 3.5), 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    // 2. If 2 hands are interacting, draw an animated glowing connection beam between contact points
    if (hands.length >= 2 && interaction && interaction.hand1_point && interaction.hand2_point) {
      const p1 = interaction.hand1_point;
      const p2 = interaction.hand2_point;
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Frame processing loop
  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(async () => {
      if (isPredictingRef.current || !videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      // Create an offscreen canvas to export the frame JPEG
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d');
      offCtx.drawImage(video, 0, 0, width, height);

      isPredictingRef.current = true;

      offscreen.toBlob(async (blob) => {
        if (!blob) {
          isPredictingRef.current = false;
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        try {
          const res = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            
            if (data.hand_detected && data.hands?.length) {
              const hands = data.hands;
              setHandDetected(true);
              setHandPredictions(hands);
              setIsTwoHandedSign(Boolean(data.is_two_handed));
              
              if (data.prediction && data.confidence >= 0.50) {
                setCurrentPrediction({
                  sign: data.prediction,
                  confidence: data.confidence,
                  isTwoHanded: data.is_two_handed
                });
                if (data.confidence >= 0.70) {
                  handleNewPrediction(data.prediction);
                }
              }

              drawLandmarks(hands, data.interaction, width, height);
            } else {
              setHandDetected(false);
              setCurrentPrediction(null);
              setHandPredictions([]);
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, width, height);
            }
          }
        } catch (err) {
          console.error("Predict error", err);
        } finally {
          isPredictingRef.current = false;
        }
      }, 'image/jpeg', 0.85);

    }, 300); // 300ms interval for fluid real-time multi-hand response

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Debouncing prediction to avoid flicker & duplicate spam
  const handleNewPrediction = (word) => {
    predictionHistory.current.push(word);
    if (predictionHistory.current.length > 4) {
      predictionHistory.current.shift();
    }
    
    // If last 2 frames are identical
    const lastTwo = predictionHistory.current.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every(v => v === word)) {
      setPredictedSentence(prev => {
        const lastWord = prev[prev.length - 1];
        if (lastWord !== word) {
          return [...prev, word];
        }
        return prev;
      });
      predictionHistory.current = [];
    }
  };

  const handleSimulateGesture = (gestureValue) => {
    setPredictedSentence(prev => [...prev, gestureValue]);
  };

  const handleAddSpace = () => {
    setPredictedSentence(prev => [...prev, ' ']);
  };

  const handleSpeak = () => {
    if (predictedSentence.length > 0) {
      const sentenceText = predictedSentence.join(' ').replace(/\s+/g, ' ').trim();
      speakText(sentenceText);
    }
  };

  const handleUndo = () => {
    setPredictedSentence(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPredictedSentence([]);
  };

  const handleCopy = () => {
    if (predictedSentence.length > 0) {
      const sentenceText = predictedSentence.join(' ').replace(/\s+/g, ' ').trim();
      navigator.clipboard.writeText(sentenceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
          <span>📷</span> Student Panel: Multi-Hand Sign to Text
        </h2>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-xs font-semibold text-teal-900">
            {backendOnline ? 'Dual-Hand ISL Engine Active' : 'Connecting to AI Backend...'}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Video stream container */}
        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
          />
          
          {/* Skeleton canvas overlay */}
          <canvas 
            ref={canvasRef} 
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${!isActive ? 'hidden' : ''}`} 
          />

          {!isActive && (
            <div className="text-center p-6 text-gray-400 flex flex-col items-center gap-2">
              <span className="text-4xl">🤲</span>
              <span className="font-semibold text-white">Camera is off</span>
              <span className="text-xs text-gray-400 max-w-xs">
                Turn on your webcam to detect two-handed & single-handed ISL gestures with 3D landmark tracking.
              </span>
            </div>
          )}
          
          {/* Live gesture HUD badge */}
          {isActive && (
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
              <div className="bg-black/75 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-white/10 shadow-lg">
                <span className={`w-2 h-2 rounded-full ${handDetected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                <span>{handDetected ? `${handPredictions.length} Hand${handPredictions.length === 1 ? '' : 's'} Tracked` : 'Searching for Hands...'}</span>
              </div>
              
              {currentPrediction && (
                <div className="flex flex-col items-end gap-1.5 max-w-[70%]">
                  <div className={`backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg border flex items-center gap-1.5 ${
                    isTwoHandedSign 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-300' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-300'
                  }`}>
                    <span>{isTwoHandedSign ? '🤲 2-Hand ISL:' : '🖐️ 1-Hand Sign:'}</span>
                    <span className="text-sm font-black uppercase text-yellow-300">{currentPrediction.sign}</span>
                    <span className="text-[10px] opacity-90">({Math.round((currentPrediction.confidence || 0) * 100)}%)</span>
                  </div>
                  
                  {/* Individual hand mini badges */}
                  {handPredictions.length >= 2 && (
                    <div className="flex gap-1">
                      {handPredictions.map((h, idx) => (
                        <span key={idx} className="text-[10px] bg-black/60 text-gray-200 px-2 py-0.5 rounded-md border border-white/10">
                          {h.handedness || `Hand ${idx+1}`}: {h.prediction || 'Tracking'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera Start / Stop */}
        <div className="flex gap-2 justify-center">
          {!isActive ? (
            <button 
              onClick={startCamera} 
              className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>🎥</span> Start Camera (Track 1 & 2 Hands)
            </button>
          ) : (
            <button 
              onClick={stopCamera} 
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>⏹</span> Stop Camera
            </button>
          )}
        </div>

        {/* Quick Simulator Buttons & Tabs */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Quick Test / Practice ISL Signs:
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setActiveTab('vowels_letters')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition ${activeTab === 'vowels_letters' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-gray-600 border'}`}
              >
                ISL Letters (A-Z)
              </button>
              <button 
                onClick={() => setActiveTab('words')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition ${activeTab === 'words' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-gray-600 border'}`}
              >
                ISL Words
              </button>
              <button 
                onClick={() => setActiveTab('single_gestures')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition ${activeTab === 'single_gestures' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-gray-600 border'}`}
              >
                1-Hand Signs
              </button>
            </div>
          </div>

          {activeTab === 'vowels_letters' && (
            <div>
              <span className="text-[10px] text-teal-700 font-semibold block mb-1.5">
                ISL Two-Handed Fingerspelling (Vowels A, E, I, O, U + Consonants B-Z):
              </span>
              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1">
                {ISL_LETTERS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleSimulateGesture(item.value)}
                    className="text-xs font-bold bg-white hover:bg-teal-600 hover:text-white text-gray-800 p-1.5 rounded-lg border border-gray-200 text-center shadow-2xs transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'words' && (
            <div className="flex flex-wrap gap-1.5">
              {ISL_WORDS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSimulateGesture(item.value)}
                  className="text-xs bg-white hover:bg-teal-50 hover:text-teal-700 text-gray-700 font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'single_gestures' && (
            <div className="flex flex-wrap gap-1.5">
              {PRESET_GESTURES.map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSimulateGesture(g.value)}
                  className="text-xs bg-white hover:bg-teal-50 hover:text-teal-700 text-gray-700 font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs transition"
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Translation Output Box */}
        <div className="mt-auto bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Translated Sentence
            </label>
            {predictedSentence.length > 0 && (
              <span className="text-xs text-teal-700 font-bold bg-teal-100 px-2.5 py-0.5 rounded-full">
                {predictedSentence.length} tokens
              </span>
            )}
          </div>

          <div className="flex-1 text-lg font-bold text-gray-800 min-h-[50px] flex items-center flex-wrap gap-1.5 bg-white p-3 rounded-lg border border-gray-200">
            {predictedSentence.length > 0 ? (
              predictedSentence.map((word, i) => (
                <span key={i} className={`${word === ' ' ? 'w-3' : 'bg-teal-50 border border-teal-200 text-teal-900 px-2 py-0.5 rounded-md shadow-2xs'}`}>
                  {word === ' ' ? '' : word}
                </span>
              ))
            ) : (
              <span className="text-gray-400 italic font-normal text-sm">
                Perform gestures with your camera or click test buttons above...
              </span>
            )}
          </div>
          
          {/* Action Toolbar */}
          <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-gray-200">
            <button 
              onClick={handleAddSpace} 
              className="px-2 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition text-xs"
              title="Add Space"
            >
              ␣ Space
            </button>
            <button 
              onClick={handleUndo} 
              disabled={predictedSentence.length === 0} 
              className="px-2 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-40 transition text-xs"
              title="Undo last token"
            >
              ↩ Undo
            </button>
            <button 
              onClick={handleClear} 
              disabled={predictedSentence.length === 0} 
              className="px-2 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-40 transition text-xs"
              title="Clear all"
            >
              🗑 Clear
            </button>
            <button 
              onClick={handleCopy} 
              disabled={predictedSentence.length === 0} 
              className="px-2 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-40 transition text-xs"
              title="Copy text"
            >
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
            <button 
              onClick={handleSpeak} 
              disabled={predictedSentence.length === 0} 
              className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-40 transition shadow-sm text-xs flex items-center justify-center gap-1"
            >
              <span>🔊</span> Speak
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignToText;
