import React, { useEffect, useRef } from 'react';

// Live microphone spectrum while `active`; a calm idle wave otherwise.
// `onLevel` receives a 0–1 loudness value each frame (used to pulse the mic orb).
const VoiceVisualizer = ({ active, onLevel, className = '' }) => {
  const canvasRef = useRef(null);
  const onLevelRef = useRef(onLevel);
  onLevelRef.current = onLevel;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let stream = null;
    let audioCtx = null;
    let analyser = null;
    let data = null;
    let cancelled = false;
    let smooth = 0;

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    if (active && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        audioCtx.createMediaStreamSource(s).connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
      }).catch(() => { /* fall back to the simulated wave */ });
    }

    const draw = (now) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = Math.max(24, Math.floor(w / (9 * dpr)));
      const gap = 3 * dpr;
      const barW = (w - gap * (bars - 1)) / bars;
      let total = 0;

      for (let i = 0; i < bars; i++) {
        let v;
        if (analyser && data) {
          if (i === 0) analyser.getByteFrequencyData(data);
          const centre = Math.abs(i - bars / 2) / (bars / 2);
          const bin = Math.floor(centre * (data.length * 0.7));
          v = data[bin] / 255;
        } else if (active) {
          v = 0.25 + 0.35 * Math.abs(Math.sin(now / 180 + i * 0.6)) * Math.abs(Math.sin(now / 410 + i * 0.25));
        } else {
          v = 0.06 + 0.05 * Math.sin(now / 700 + i * 0.35);
        }
        total += v;
        const barH = Math.max(3 * dpr, v * h * 0.92);
        const x = i * (barW + gap);
        const y = (h - barH) / 2;
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        if (active) {
          grad.addColorStop(0, 'rgba(242,161,123,.95)');
          grad.addColorStop(0.5, 'rgba(243,192,120,.95)');
          grad.addColorStop(1, 'rgba(242,161,123,.95)');
        } else {
          grad.addColorStop(0, 'rgba(123,216,189,.35)');
          grad.addColorStop(1, 'rgba(123,216,189,.35)');
        }
        ctx.fillStyle = grad;
        const r = Math.min(barW / 2, barH / 2);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, r);
        else ctx.rect(x, y, barW, barH);
        ctx.fill();
      }

      smooth += ((active ? total / bars : 0) - smooth) * 0.25;
      onLevelRef.current?.(Math.min(1, smooth * 1.6));
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close().catch(() => {});
      onLevelRef.current?.(0);
    };
  }, [active]);

  return <canvas ref={canvasRef} className={`voice-visualizer ${className}`} aria-hidden="true" />;
};

export default VoiceVisualizer;
