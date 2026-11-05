import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Magnetic from './fx/Magnetic';
import { ArrowUpRightIcon } from './fx/Icons';
import './Navbar.css';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Classroom', path: '/classroom' },
  { name: 'Learn ISL', path: '/learn' },
  { name: 'Games', path: '/games' },
  { name: 'About', path: '/about' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ x: 0, w: 0, visible: false });
  const location = useLocation();
  const linksRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 12);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  const movePillTo = (el) => {
    if (!el || !linksRef.current) return;
    setPill({ x: el.offsetLeft, w: el.offsetWidth, visible: true });
  };

  const resetPill = () => {
    const active = linksRef.current?.querySelector('.nav-link.is-active');
    if (active) movePillTo(active);
    else setPill((p) => ({ ...p, visible: false }));
  };

  useLayoutEffect(() => {
    resetPill();
    window.addEventListener('resize', resetPill);
    return () => window.removeEventListener('resize', resetPill);
  }, [location.pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${isOpen ? ' is-open' : ''}`}>
      <nav className="site-nav" aria-label="Main navigation">
        <Link to="/" className="site-brand" aria-label="SignBridge home">
          <span className="brand-symbol" aria-hidden="true">s</span>
          <span className="brand-name">signbridge<span>.</span></span>
        </Link>

        <div className="desktop-nav" ref={linksRef} onMouseLeave={resetPill}>
          <span
            className="nav-pill"
            aria-hidden="true"
            style={{ width: pill.w, transform: `translateX(${pill.x}px)`, opacity: pill.visible ? 1 : 0 }}
          />
          {navLinks.map(({ name, path }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link${location.pathname === path ? ' is-active' : ''}`}
              aria-current={location.pathname === path ? 'page' : undefined}
              onMouseEnter={(e) => movePillTo(e.currentTarget)}
              onFocus={(e) => movePillTo(e.currentTarget)}
            >
              {name}
            </Link>
          ))}
        </div>

        <Magnetic className="nav-cta-wrap">
          <Link to="/classroom" className="nav-cta">
            <span className="nav-cta-dot" aria-hidden="true" />
            Join a classroom <ArrowUpRightIcon />
          </Link>
        </Magnetic>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span /><span />
        </button>
      </nav>

      <div className="nav-progress" aria-hidden="true"><span ref={progressRef} /></div>

      <div id="mobile-navigation" className={`mobile-nav${isOpen ? ' is-open' : ''}`}>
        {navLinks.map(({ name, path }, index) => (
          <Link
            key={path}
            to={path}
            onClick={() => setIsOpen(false)}
            className={`mobile-nav-link${location.pathname === path ? ' is-active' : ''}`}
            aria-current={location.pathname === path ? 'page' : undefined}
            style={{ '--i': index }}
          >
            <span className="mobile-nav-index">0{index + 1}</span>
            {name}
            <ArrowUpRightIcon />
          </Link>
        ))}
        <Link to="/classroom" className="btn btn--primary btn--lg mobile-nav-cta" onClick={() => setIsOpen(false)} style={{ '--i': navLinks.length }}>
          Join a classroom <ArrowUpRightIcon />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
