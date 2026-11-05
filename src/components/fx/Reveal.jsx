import React from 'react';
import { useReveal } from './hooks';

const Reveal = ({ as = 'div', variant = 'up', delay = 0, style, children, ...rest }) => {
  const Tag = as;
  const ref = useReveal();
  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      style={{ ...style, '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
