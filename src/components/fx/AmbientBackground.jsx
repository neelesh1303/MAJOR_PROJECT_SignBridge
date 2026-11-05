import React, { useEffect, useRef } from 'react';

const COLORS = ['123,216,189', '242,161,123', '179,156,236'];

// Fixed backdrop: aurora blobs, a landmark-style particle constellation that
// reacts to the pointer, a soft cursor spotlight and film grain.
const AmbientBackground = () => {
  const canvasRef = useRef(null);
  const spotRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -9999, y: -9999, active: false };
    let width = 0;
    let height = 0;
    let particles = [];
    let raf = 0;

    const seed = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (width * height) / 19000));
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.6,
        c: COLORS[i % 7 === 0 ? 1 : i % 11 === 0 ? 2 : 0],
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const linkDist = 120;
      const pointerDist = 190;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 9000 && d2 > 0.1) {
              const force = (9000 - d2) / 9000;
              p.x += (dx / Math.sqrt(d2)) * force * 1.6;
              p.y += (dy / Math.sqrt(d2)) * force * 1.6;
            }
          }
        }

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(${p.c},${(1 - d / linkDist) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < pointerDist) {
            ctx.strokeStyle = `rgba(123,216,189,${(1 - d / pointerDist) * 0.42})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${p.c},.75)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced && !document.hidden) raf = requestAnimationFrame(draw);
    };

    const onMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = event.pointerType !== 'touch';
      if (spotRef.current) {
        spotRef.current.style.setProperty('--cx', `${event.clientX}px`);
        spotRef.current.style.setProperty('--cy', `${event.clientY}px`);
      }
    };
    const onLeave = () => { pointer.active = false; };
    const onResize = () => { seed(); if (reduced) draw(); };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw);
    };

    seed();
    draw();
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-blob ambient-blob--mint" />
      <div className="ambient-blob ambient-blob--coral" />
      <div className="ambient-blob ambient-blob--violet" />
      <canvas ref={canvasRef} className="ambient-canvas" />
      <div ref={spotRef} className="ambient-spot" />
      <div className="ambient-grain" />
    </div>
  );
};

export default AmbientBackground;
