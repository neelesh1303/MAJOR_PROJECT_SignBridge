import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link to="/" className="site-brand" onClick={() => setIsOpen(false)} aria-label="SignBridge home">
          <span className="brand-symbol" aria-hidden="true">s</span>
          <span className="brand-name">signbridge<span>.</span></span>
        </Link>

        <div className="desktop-nav">
          {navLinks.map(({ name, path }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link${location.pathname === path ? ' is-active' : ''}`}
              aria-current={location.pathname === path ? 'page' : undefined}
            >
              {name}
            </Link>
          ))}
        </div>

        <Link to="/classroom" className="nav-cta">
          Join a classroom <span aria-hidden="true">↗</span>
        </Link>

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

      <div id="mobile-navigation" className={`mobile-nav${isOpen ? ' is-open' : ''}`}>
        {navLinks.map(({ name, path }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setIsOpen(false)}
            className={`mobile-nav-link${location.pathname === path ? ' is-active' : ''}`}
            aria-current={location.pathname === path ? 'page' : undefined}
          >
            {name}<span aria-hidden="true">↗</span>
          </Link>
        ))}
        <Link to="/classroom" className="mobile-nav-cta" onClick={() => setIsOpen(false)}>
          Join a classroom <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
