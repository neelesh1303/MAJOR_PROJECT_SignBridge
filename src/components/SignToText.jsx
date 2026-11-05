import React, { useEffect, useRef, useState } from 'react';
import { speakText } from '../services/speechService';
import HandSkeleton from './fx/HandSkeleton';
import Segmented from './fx/Segmented';
import {
  CameraIcon, StopIcon, SpaceIcon, UndoIcon, TrashIcon, CopyIcon, CheckIcon, SpeakerIcon,
} from './fx/Icons';

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
      const color = handIndex === 0 ? '#7bd8bd' : '#f2a17b';
      const jointColor = handIndex === 0 ? '#3fcba3' : '#f3c078';

      // Draw bone connections with a neon glow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
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
      ctx.restore();

      // Draw landmark joints
      landmarks.forEach((pt, i) => {
        const isFingertip = [4, 8, 12, 16, 20].includes(i);
        ctx.fillStyle = isFingertip ? '#82c8f2' : jointColor;
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
      ctx.strokeStyle = '#82c8f2';
      ctx.shadowColor = '#82c8f2';
      ctx.shadowBlur = 16;
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

  const confidencePct = Math.round((currentPrediction?.confidence || 0) * 100);
  const ringCircumference = 2 * Math.PI * 18;

  return (
    <section className="studio glass-panel tone-mint" aria-label="Student panel: sign to text">
      {/* Header */}
      <header className="studio-head">
        <span className="studio-badge"><CameraIcon /></span>
        <div>
          <span className="studio-kicker mono">Student</span>
          <h2>Sign → Text</h2>
        </div>
        <span className={`studio-status ${backendOnline ? 'is-online' : 'is-offline'}`}>
          <span className="live-dot" />
          {backendOnline ? 'Dual-hand ISL engine active' : backendOnline === false ? 'Connecting to AI backend…' : 'Checking engine…'}
        </span>
      </header>

      <div className="studio-body">
        {error && <div className="notice fade-up">{error}</div>}

        {/* Video stream container */}
        <div className={`cam${isActive ? ' is-active' : ''}${handDetected ? ' has-hand' : ''}`}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ display: isActive ? 'block' : 'none' }}
          />

          {/* Skeleton canvas overlay */}
          <canvas ref={canvasRef} style={{ display: isActive ? 'block' : 'none' }} />

          <div className="hud-grid" />
          <div className="hud-corners"><i /><i /><i /><i /></div>
          {isActive && <div className="scanline" />}

          {!isActive && (
            <div className="cam-off">
              <HandSkeleton hands={2} interval={2000} title="Preview of two-hand landmark tracking" />
              <strong>Camera is off</strong>
              <span>Turn on your webcam to detect two-handed and single-handed ISL gestures with 3D landmark tracking.</span>
            </div>
          )}

          {/* Live gesture HUD badge */}
          {isActive && (
            <div className="cam-hud">
              <span className={`cam-pill ${handDetected ? 'is-on' : 'is-off'}`}>
                <span className="live-dot" />
                {handDetected ? `${handPredictions.length} hand${handPredictions.length === 1 ? '' : 's'} tracked` : 'Searching for hands…'}
              </span>

              {currentPrediction && (
                <div className="cam-prediction">
                  <div key={currentPrediction.sign} className={`cam-prediction-card pop-in${isTwoHandedSign ? ' is-two' : ''}`}>
                    <span className="conf-ring">
                      <svg viewBox="0 0 44 44">
                        <circle className="track" cx="22" cy="22" r="18" />
                        <circle
                          className="value"
                          cx="22"
                          cy="22"
                          r="18"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringCircumference * (1 - confidencePct / 100)}
                        />
                      </svg>
                      <b>{confidencePct}</b>
                    </span>
                    <span>
                      <span className="cam-prediction-kind">{isTwoHandedSign ? '2-hand ISL' : '1-hand sign'}</span>
                      <span className="cam-prediction-sign">{currentPrediction.sign}</span>
                    </span>
                  </div>

                  {/* Individual hand mini badges */}
                  {handPredictions.length >= 2 && (
                    <div className="cam-hands">
                      {handPredictions.map((h, idx) => (
                        <span key={idx}>{h.handedness || `Hand ${idx + 1}`}: {h.prediction || 'Tracking'}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera Start / Stop */}
        {!isActive ? (
          <button type="button" onClick={startCamera} className="btn btn--primary btn--lg btn--block">
            <CameraIcon /> Start camera · track 1 &amp; 2 hands
          </button>
        ) : (
          <button type="button" onClick={stopCamera} className="btn btn--danger btn--lg btn--block">
            <StopIcon /> Stop camera
          </button>
        )}

        {/* Quick Simulator Buttons & Tabs */}
        <div className="practice">
          <div className="practice-head">
            <span className="mono practice-title">Quick test · practice ISL signs</span>
            <Segmented
              label="Practice sign set"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'vowels_letters', label: 'Letters A–Z' },
                { value: 'words', label: 'Words' },
                { value: 'single_gestures', label: '1-hand' },
              ]}
            />
          </div>

          {activeTab === 'vowels_letters' && (
            <div className="fade-up">
              <span className="practice-hint">ISL two-handed fingerspelling — vowels A, E, I, O, U + consonants B–Z</span>
              <div className="letter-pad">
                {ISL_LETTERS.map((item) => (
                  <button key={item.value} type="button" onClick={() => handleSimulateGesture(item.value)} className="letter-key">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'words' && (
            <div className="gesture-pad fade-up">
              {ISL_WORDS.map((item, idx) => (
                <button key={idx} type="button" onClick={() => handleSimulateGesture(item.value)} className="chip">
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'single_gestures' && (
            <div className="gesture-pad fade-up">
              {PRESET_GESTURES.map((g, idx) => (
                <button key={idx} type="button" onClick={() => handleSimulateGesture(g.value)} className="chip">
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Translation Output Box */}
        <div className="sentence">
          <div className="sentence-head">
            <span className="mono practice-title">Translated sentence</span>
            {predictedSentence.length > 0 && (
              <span className="tag tag--mint">{predictedSentence.length} tokens</span>
            )}
          </div>

          <div className="sentence-tokens" aria-live="polite">
            {predictedSentence.length > 0 ? (
              predictedSentence.map((word, i) => (
                <span key={i} className={word === ' ' ? 'token token--space' : 'token'}>
                  {word === ' ' ? '' : word}
                </span>
              ))
            ) : (
              <span className="sentence-empty">Perform gestures with your camera or tap the test buttons above…</span>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="sentence-actions">
            <button type="button" onClick={handleAddSpace} className="btn" title="Add space"><SpaceIcon /> Space</button>
            <button type="button" onClick={handleUndo} disabled={predictedSentence.length === 0} className="btn" title="Undo last token"><UndoIcon /> Undo</button>
            <button type="button" onClick={handleClear} disabled={predictedSentence.length === 0} className="btn" title="Clear all"><TrashIcon /> Clear</button>
            <button type="button" onClick={handleCopy} disabled={predictedSentence.length === 0} className="btn" title="Copy text">
              {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
            </button>
            <button type="button" onClick={handleSpeak} disabled={predictedSentence.length === 0} className="btn btn--primary"><SpeakerIcon /> Speak</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignToText;
