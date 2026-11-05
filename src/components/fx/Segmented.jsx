import React, { useLayoutEffect, useRef, useState } from 'react';

// Pill segmented control with a springy sliding thumb.
const Segmented = ({ options, value, onChange, label, className = '' }) => {
  const wrapRef = useRef(null);
  const [thumb, setThumb] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const active = wrap?.querySelector('button.is-active');
      if (!wrap || !active) return;
      setThumb({ x: active.offsetLeft - 4, w: active.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, options.length]);

  return (
    <div ref={wrapRef} className={`segmented ${className}`} role="tablist" aria-label={label}>
      <span className="segmented-thumb" style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }} aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Segmented;
