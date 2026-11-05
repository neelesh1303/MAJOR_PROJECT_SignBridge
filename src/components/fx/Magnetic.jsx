import React, { useRef } from 'react';

// Pulls its child gently toward the pointer while hovered.
const Magnetic = ({ strength = 0.28, children, className = '' }) => {
  const ref = useRef(null);

  const handleMove = (event) => {
    const node = ref.current;
    if (!node || event.pointerType === 'touch') return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    node.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <span
      ref={ref}
      className={`magnetic ${className}`}
      style={{ display: 'inline-flex', transition: 'transform .45s cubic-bezier(.16,1,.3,1)' }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </span>
  );
};

export default Magnetic;
