import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import AmbientBackground from './components/fx/AmbientBackground';
import CursorRing from './components/fx/CursorRing';
import Home from './pages/Home';
import About from './pages/About';
import Classroom from './pages/Classroom';
import Learn from './pages/Learn';
import Games from './pages/Games';
import NotFound from './pages/NotFound';

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <span className="footer-mark"><span className="brand-symbol" aria-hidden="true">s</span> signbridge<span style={{ color: 'var(--coral)' }}>.</span></span>
      <p>Different ways to communicate. One place to belong.</p>
      <nav aria-label="Footer">
        <Link to="/classroom">Classroom</Link>
        <Link to="/learn">Learn ISL</Link>
        <Link to="/games">Games</Link>
        <Link to="/about">About</Link>
      </nav>
    </div>
  </footer>
);

const AppShell = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  return (
    <div className="app-shell">
      <AmbientBackground />
      <CursorRing />
      <Navbar />
      <main className="app-main">
        <div key={location.pathname} className="route-stage">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/games" element={<Games />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
