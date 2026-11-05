import React, { useEffect, useState } from 'react';
import { useInView } from './hooks';

// Counts from 0 to `value` once scrolled into view.
const CountUp = ({ value, duration = 1600, suffix = '', className = '' }) => {
  const [ref, inView] = useInView({ threshold: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return <span ref={ref} className={className}>{display}{suffix}</span>;
};

export default CountUp;
