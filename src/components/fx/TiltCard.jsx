import React, { useRef } from 'react';

// Card that tilts toward the pointer and carries a spotlight under it.
const TiltCard = ({ as = 'div', max = 8, className = '', children, ...rest }) => {
  const Tag = as;
  const ref = useRef(null);
  const frame = useRef(0);

  const handleMove = (event) => {
    const node = ref.current;
    if (!node || event.pointerType === 'touch') return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      node.classList.add('is-tilting');
      node.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
      node.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
      node.style.setProperty('--mx', `${px * 100}%`);
      node.style.setProperty('--my', `${py * 100}%`);
    });
  };

  const handleLeave = () => {
    const node = ref.current;
    if (!node) return;
    cancelAnimationFrame(frame.current);
    node.classList.remove('is-tilting');
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  };

  return (
    <Tag
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      <span className="tilt-spot" aria-hidden="true" />
      {children}
    </Tag>
  );
};

export default TiltCard;
