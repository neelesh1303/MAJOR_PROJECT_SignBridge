import React, { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], input, select, textarea, label, .tilt';

// Trailing ring + dot that grows over interactive elements. The native cursor stays visible.
const CursorRing = () => {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let raf = 0;

    const loop = () => {
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      ring.style.setProperty('--rx', `${current.x}px`);
      ring.style.setProperty('--ry', `${current.y}px`);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      dot.style.setProperty('--dx', `${event.clientX}px`);
      dot.style.setProperty('--dy', `${event.clientY}px`);
      ring.classList.remove('is-hidden');
      dot.classList.remove('is-hidden');
      ring.classList.toggle('is-hover', Boolean(event.target.closest?.(INTERACTIVE)));
    };
    const onDown = () => ring.classList.add('is-down');
    const onUp = () => ring.classList.remove('is-down');
    const onLeave = () => { ring.classList.add('is-hidden'); dot.classList.add('is-hidden'); };

    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring is-hidden" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot is-hidden" aria-hidden="true" />
    </>
  );
};

export default CursorRing;
