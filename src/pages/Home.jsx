import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const previewModes = {
  listen: {
    label: 'Listen',
    title: 'A voice becomes a conversation.',
    message: 'Good morning, everyone. Let’s begin with today’s lesson.',
    detail: 'Speech captured in real time',
  },
  read: {
    label: 'Read',
    title: 'Every word, right on time.',
    message: 'Good morning, everyone. Let’s begin with today’s lesson.',
    detail: 'Live captions are ready',
  },
  sign: {
    label: 'Sign',
    title: 'Meaning moves beyond words.',
    message: 'GOOD MORNING · EVERYONE · TODAY · LESSON',
    detail: 'ISL signs matched to the message',
  },
};

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Home = () => {
  const [activeMode, setActiveMode] = useState('listen');
  const preview = previewModes[activeMode];

  return (
    <div className="home-page">
      <div className="home-atmosphere" aria-hidden="true">
        <span className="atmosphere-orb atmosphere-orb--mint" />
        <span className="atmosphere-orb atmosphere-orb--lilac" />
        <span className="atmosphere-grid" />
        <span className="atmosphere-spark atmosphere-spark--one">✳</span>
        <span className="atmosphere-spark atmosphere-spark--two">✳</span>
      </div>

      <section className="home-hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-dot" />
            COMMUNICATION, WITHOUT LIMITS
          </div>
          <h1>
            A classroom where <span>every voice</span> belongs.
          </h1>
          <p className="hero-description">
            Bringing hearing, Deaf, hard-of-hearing and non-speaking learners
            together through speech, text and Indian Sign Language.
          </p>

          <div className="hero-actions">
            <Link to="/classroom" className="button-primary">
              Enter the classroom <ArrowIcon />
            </Link>
            <Link to="/learn" className="button-secondary">
              Explore ISL <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="hero-note">
            <span className="note-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3.75 19 6.5v5.25c0 4.25-2.9 7.3-7 8.5-4.1-1.2-7-4.25-7-8.5V6.5l7-2.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Made for more inclusive learning, together.
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-halo visual-halo--outer" aria-hidden="true" />
          <div className="visual-halo visual-halo--inner" aria-hidden="true" />
          <div className="preview-card">
            <div className="preview-topbar">
              <div className="preview-brand">
                <span className="preview-brand-mark" aria-hidden="true">s</span>
                <span>signbridge <small>classroom</small></span>
              </div>
              <span className="live-indicator"><i /> LIVE</span>
            </div>

            <div className="preview-content">
              <div className="preview-heading">
                <div>
                  <span className="preview-overline">A MORE CONNECTED CLASS</span>
                  <h2>{preview.title}</h2>
                </div>
                <span className="preview-sparkle" aria-hidden="true">✳</span>
              </div>

              <div className={`message-card message-card--${activeMode}`}>
                <div className="message-avatar" aria-hidden="true">M</div>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>Ms. Meera</strong>
                    <span>{activeMode === 'listen' ? 'Speaking now' : 'Just now'}</span>
                  </div>
                  <p>{preview.message}</p>
                  {activeMode === 'listen' && (
                    <div className="sound-wave" aria-label="Audio waveform">
                      {Array.from({ length: 29 }, (_, index) => (
                        <i key={index} style={{ '--bar': `${12 + ((index * 17) % 28)}px` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="preview-footer">
                <span className="connection-status"><i /> {preview.detail}</span>
                <div className="preview-avatars" aria-label="Class participants">
                  <span>R</span><span>A</span><span>+</span>
                </div>
              </div>
            </div>

            <div className="preview-tabs" role="group" aria-label="Preview communication modes">
              {Object.entries(previewModes).map(([mode, { label }]) => (
                <button
                  key={mode}
                  type="button"
                  className={activeMode === mode ? 'preview-tab is-active' : 'preview-tab'}
                  onClick={() => setActiveMode(mode)}
                  aria-pressed={activeMode === mode}
                >
                  <span className={`mode-dot mode-dot--${mode}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="floating-note floating-note--top">
            <span className="floating-note-icon" aria-hidden="true">✦</span>
            <span><strong>One shared space</strong><small>Everyone can join in</small></span>
          </div>
          <div className="floating-note floating-note--bottom">
            <span className="floating-wave" aria-hidden="true"><i /><i /><i /><i /></span>
            <span><strong>Words in motion</strong><small>Speech · text · signs</small></span>
          </div>
        </div>
      </section>

      <section className="home-pathways" aria-labelledby="pathways-heading">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">FIND YOUR WAY IN</span>
            <h2 id="pathways-heading">Small steps. Stronger connections.</h2>
          </div>
          <p>Whether you’re here to connect, discover or play — there’s a place for you.</p>
        </div>

        <div className="pathway-grid">
          <Link to="/classroom" className="pathway-card pathway-card--classroom">
            <span className="pathway-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 5.75A1.75 1.75 0 0 1 5.75 4h12.5A1.75 1.75 0 0 1 20 5.75v8.5A1.75 1.75 0 0 1 18.25 16H14l-2 4-2-4H5.75A1.75 1.75 0 0 1 4 14.25v-8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </span>
            <span className="pathway-number">01 / CONNECT</span>
            <h3>Step into the classroom</h3>
            <p>Turn everyday lessons into a shared conversation with speech, text and signs.</p>
            <span className="pathway-link">Let’s connect <ArrowIcon /></span>
          </Link>

          <Link to="/learn" className="pathway-card pathway-card--learn">
            <span className="pathway-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 20V9m0 0c0-2.2-1.35-4-3-4S6 6.8 6 9v2m6-2c0-2.2 1.35-4 3-4s3 1.8 3 4v1m-6 10c-3.3 0-6-2.7-6-6v-2m6 8c3.3 0 6-2.7 6-6v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="pathway-number">02 / DISCOVER</span>
            <h3>Learn a new sign</h3>
            <p>Explore Indian Sign Language at your own pace, one word and one gesture at a time.</p>
            <span className="pathway-link">Explore the dictionary <ArrowIcon /></span>
          </Link>

          <Link to="/games" className="pathway-card pathway-card--games">
            <span className="pathway-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M8.5 10.5h7m-3.5-3v6m-5.2 5.7-2 .45a1.8 1.8 0 0 1-2.1-2.2l1.6-7A3.2 3.2 0 0 1 7.4 6h9.2a3.2 3.2 0 0 1 3.1 2.45l1.6 7a1.8 1.8 0 0 1-2.1 2.2l-2-.45-2-1.7h-4.7l-2 1.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="17" cy="9" r=".8" fill="currentColor" /><circle cx="18.7" cy="11" r=".8" fill="currentColor" /></svg>
            </span>
            <span className="pathway-number">03 / PLAY</span>
            <h3>Make practice playful</h3>
            <p>Build confidence with friendly quizzes and quick challenges made for learning.</p>
            <span className="pathway-link">Play and practice <ArrowIcon /></span>
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <span className="footer-mark" aria-hidden="true">s</span>
        <p>Different ways to communicate. One place to belong.</p>
        <Link to="/about">Our mission <span aria-hidden="true">↗</span></Link>
      </footer>
    </div>
  );
};

export default Home;
