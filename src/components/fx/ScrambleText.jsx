import React, { useEffect, useRef, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+<>/\\=';

// Decodes text through random glyphs whenever `text` changes.
const ScrambleText = ({ text, duration = 650, className = '', as = 'span' }) => {
  const Tag = as;
  const [output, setOutput] = useState(text);
  const frame = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setOutput(text);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const revealed = Math.floor(progress * text.length);
      let next = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < revealed || ch === ' ') next += ch;
        else next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOutput(next);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, duration]);

  return <Tag className={className} aria-label={text}><span aria-hidden="true">{output}</span></Tag>;
};

export default ScrambleText;
