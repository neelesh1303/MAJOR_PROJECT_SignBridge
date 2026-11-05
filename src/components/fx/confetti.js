const COLORS = ['#7bd8bd', '#3fcba3', '#f2a17b', '#f3c078', '#82c8f2', '#b39cec', '#ffffff'];

// Fires a short confetti burst from a viewport point (defaults to centre).
export const burstConfetti = ({ x, y, count = 140 } = {}) => {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10000,
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const ox = x ?? width / 2;
  const oy = y ?? height / 2;
  const pieces = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.3,
    };
  });

  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, width, height);
    pieces.forEach((p) => {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 1900);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
      }
      ctx.restore();
    });
    if (t < 1900) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
};

export const burstFromElement = (element, options) => {
  if (!element) return burstConfetti(options);
  const rect = element.getBoundingClientRect();
  return burstConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, ...options });
};
