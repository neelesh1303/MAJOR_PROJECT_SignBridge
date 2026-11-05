import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import HandSkeleton from '../components/fx/HandSkeleton';
import ScrambleText from '../components/fx/ScrambleText';
import TiltCard from '../components/fx/TiltCard';
import Magnetic from '../components/fx/Magnetic';
import Reveal from '../components/fx/Reveal';
import CountUp from '../components/fx/CountUp';
import {
  ArrowIcon, ArrowUpRightIcon, MicIcon, CameraIcon, BookIcon, GameIcon, SparkleIcon,
} from '../components/fx/Icons';
import { loadDictionary, translateTextToSigns } from '../utils/textToSigns';
import './Home.css';

const STORY_MS = 6500;

const stories = [
  {
    id: 'speak',
    label: 'Speak',
    headline: <>Every voice<br />has a <em>place.</em></>,
    caption: 'Speech becomes live text and Indian Sign Language the moment it’s spoken.',
  },
  {
    id: 'sign',
    label: 'Sign',
    headline: <>Every gesture<br />can <em>connect.</em></>,
    caption: 'Your webcam reads one- and two-handed ISL signs and turns them into words.',
  },
  {
    id: 'together',
    label: 'Together',
    headline: <>Different ways.<br /><em>One conversation.</em></>,
    caption: 'A more inclusive classroom starts with understanding each other.',
  },
];

const DEMO_SUGGESTIONS = ['Hello, nice to meet you', 'Good morning', 'Are you hungry?', 'Take care', 'Signbridge'];

const features = [
  {
    to: '/classroom',
    icon: MicIcon,
    tone: 'coral',
    kicker: 'Teacher panel',
    title: 'Speech → Sign',
    body: 'Talk naturally. Words appear as live captions and play back as ISL phrases or fingerspelling.',
    visual: 'wave',
    span: 'wide',
  },
  {
    to: '/classroom',
    icon: CameraIcon,
    tone: 'mint',
    kicker: 'Student panel',
    title: 'Sign → Text',
    body: 'Multi-hand landmark tracking turns gestures into sentences that can be spoken aloud.',
    visual: 'scan',
  },
  {
    to: '/learn',
    icon: BookIcon,
    tone: 'sky',
    kicker: 'Dictionary',
    title: 'Learn ISL',
    body: 'Browse every phrase, word and letter with animated reference signs.',
    visual: 'cards',
  },
  {
    to: '/games',
    icon: GameIcon,
    tone: 'violet',
    kicker: 'Practice',
    title: 'Play & grow',
    body: 'Quiz streaks and caption scrambles make practice feel like play.',
    visual: 'dice',
    span: 'wide',
  },
];

const pipeline = [
  { n: '01', title: 'Capture', body: 'Microphone audio or webcam frames stream in from the browser.' },
  { n: '02', title: 'Understand', body: 'Web Speech transcribes voice; MediaPipe extracts 21 landmarks per hand.' },
  { n: '03', title: 'Translate', body: 'Text maps to ISL phrase signs, falling back to letter-by-letter fingerspelling.' },
  { n: '04', title: 'Express', body: 'Signs animate on screen and recognised gestures are spoken aloud.' },
];

const HeroHud = () => {
  const [pose, setPose] = useState('HELLO');
  const [confidence, setConfidence] = useState(96);

  const handlePose = (next) => {
    setPose(next.label);
    setConfidence(86 + Math.floor(Math.random() * 13));
  };

  return (
    <TiltCard className="hero-hud glass-panel glass-panel--glow" max={6}>
      <div className="hud-topbar">
        <span className="hud-live"><span className="live-dot" /> ISL ENGINE · LIVE</span>
        <span className="mono hud-meta">2 HANDS · 42 PTS</span>
      </div>
      <div className="hud-viewport">
        <div className="hud-grid" />
        <div className="scanline" />
        <div className="hud-corners"><i /><i /><i /><i /></div>
        <HandSkeleton hands={2} onPose={handlePose} title="Two animated hand skeletons signing" />
      </div>
      <div className="hud-readout">
        <div>
          <span className="hud-label">DETECTED SIGN</span>
          <ScrambleText text={pose} className="hud-sign" />
        </div>
        <div className="hud-confidence">
          <span className="hud-label">CONFIDENCE <b className="mono">{confidence}%</b></span>
          <span className="hud-bar"><span style={{ width: `${confidence}%` }} /></span>
        </div>
      </div>
      <span className="hud-float hud-float--one"><MicIcon /> voice → text</span>
      <span className="hud-float hud-float--two"><SparkleIcon /> text → sign</span>
      <span className="hud-float hud-float--three"><CameraIcon /> sign → voice</span>
    </TiltCard>
  );
};

const SignDemo = () => {
  const [text, setText] = useState('Hello, nice to meet you');
  const [signs, setSigns] = useState([]);
  const [active, setActive] = useState(0);
  const requestRef = useRef(0);
  const stripRef = useRef(null);

  useEffect(() => {
    const id = ++requestRef.current;
    const timer = setTimeout(async () => {
      const result = await translateTextToSigns(text);
      if (id !== requestRef.current) return;
      setSigns(result.slice(0, 30));
      setActive(0);
    }, 320);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (signs.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % signs.length), 1300);
    return () => clearInterval(timer);
  }, [signs]);

  useEffect(() => {
    const strip = stripRef.current;
    const card = strip?.children[active];
    if (strip && card) {
      strip.scrollTo({ left: card.offsetLeft - strip.clientWidth / 2 + card.clientWidth / 2, behavior: 'smooth' });
    }
  }, [active]);

  const current = signs[active];

  return (
    <div className="demo glass-panel">
      <div className="demo-input-row">
        <label className="field demo-field">
          <SparkleIcon />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type anything to see it signed…"
            aria-label="Text to translate into sign language"
            maxLength={80}
          />
          <span className="mono demo-count">{signs.length} signs</span>
        </label>
        <div className="demo-suggestions">
          {DEMO_SUGGESTIONS.map((s) => (
            <button key={s} type="button" className={`chip${text === s ? ' is-active' : ''}`} onClick={() => setText(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="demo-stage">
        <div className="demo-spotlight">
          {current ? (
            <figure key={`${active}-${current.label}`} className="demo-figure pop-in">
              <img src={current.value} alt={`ISL sign for ${current.label}`} />
              <figcaption>
                <strong>{current.label}</strong>
                {current.isFingerspelled
                  ? <span className="tag tag--amber">Spelling “{current.wordGroup}”</span>
                  : <span className="tag tag--mint">Full sign</span>}
              </figcaption>
            </figure>
          ) : (
            <p className="demo-empty">Start typing — signs appear here instantly.</p>
          )}
        </div>
        <div className="demo-strip" ref={stripRef}>
          {signs.map((sign, i) => (
            <button
              key={`${i}-${sign.label}`}
              type="button"
              className={`demo-thumb${i === active ? ' is-active' : ''}${sign.isFingerspelled ? ' is-letter' : ''}`}
              onClick={() => setActive(i)}
              style={{ animationDelay: `${i * 35}ms` }}
              aria-label={`Show sign ${sign.label}`}
            >
              <img src={sign.value} alt="" loading="lazy" />
              <span>{sign.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureVisual = ({ type }) => {
  if (type === 'wave') {
    return (
      <div className="fv-wave" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => <span key={i} style={{ animationDelay: `${i * -0.09}s` }} />)}
      </div>
    );
  }
  if (type === 'scan') {
    return (
      <div className="fv-scan" aria-hidden="true">
        <div className="hud-corners"><i /><i /><i /><i /></div>
        <div className="scanline" />
        <HandSkeleton interval={1800} offset={0} />
      </div>
    );
  }
  if (type === 'cards') {
    return (
      <div className="fv-cards" aria-hidden="true">
        {['/letters/i.jpg', '/letters/s.jpg', '/letters/l.jpg'].map((src, i) => (
          <span key={src} style={{ '--i': i }}><img src={src} alt="" /></span>
        ))}
      </div>
    );
  }
  return (
    <div className="fv-dice" aria-hidden="true">
      {['A', 'B', 'C', 'D'].map((l, i) => <span key={l} style={{ '--i': i }}>{l}</span>)}
    </div>
  );
};

const Home = () => {
  const [activeStory, setActiveStory] = useState(0);
  const [paused, setPaused] = useState(false);
  const [phrases, setPhrases] = useState([]);
  const [counts, setCounts] = useState({ total: 115, phrases: 47 });
  const story = stories[activeStory];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => setActiveStory((i) => (i + 1) % stories.length), STORY_MS);
    return () => clearTimeout(timer);
  }, [activeStory, paused]);

  useEffect(() => {
    loadDictionary().then((dict) => {
      const multi = dict.filter((e) => e.word.length > 1).map((e) => e.word);
      setPhrases(multi);
      setCounts({ total: dict.length, phrases: dict.filter((e) => e.word.includes(' ')).length });
    });
  }, []);

  const half = Math.ceil(phrases.length / 2);
  const rows = [phrases.slice(0, half), phrases.slice(half)];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-inner">
          <div className="hero-message" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <span className="eyebrow">Learning without barriers</span>
            <h1 key={story.id} className="display hero-title">{story.headline}</h1>
            <p key={`${story.id}-c`} className="hero-subtitle">{story.caption}</p>

            <div className="hero-ctas">
              <Magnetic>
                <Link className="btn btn--primary btn--lg" to="/classroom">
                  Step into the classroom <ArrowIcon />
                </Link>
              </Magnetic>
              <Link className="btn btn--ghost btn--lg hero-secondary" to="/about">
                Why SignBridge <ArrowUpRightIcon />
              </Link>
            </div>

            <div className="story-picker" role="tablist" aria-label="Explore what SignBridge connects">
              {stories.map((item, index) => (
                <button
                  type="button"
                  role="tab"
                  key={item.id}
                  aria-selected={activeStory === index}
                  className={`story-tab${activeStory === index ? ' is-active' : ''}${index < activeStory ? ' is-done' : ''}`}
                  onClick={() => setActiveStory(index)}
                >
                  <span className="story-tab-index mono">0{index + 1}</span>
                  {item.label}
                  <span className="story-progress" aria-hidden="true">
                    <span style={{ animationDuration: `${STORY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="hero-art">
            <HeroHud />
          </div>
        </div>

        <a className="hero-scroll" href="#try-it" aria-label="Scroll to explore">
          <span className="mono">SCROLL</span>
          <span className="hero-scroll-line" aria-hidden="true" />
        </a>
      </section>

      <section className="home-marquee" aria-label="Signs in the SignBridge dictionary">
        {rows.map((row, r) => row.length > 0 && (
          <div key={r} className={`marquee${r ? ' marquee--reverse' : ''}`} style={{ '--duration': `${70 + r * 12}s` }}>
            {[0, 1].map((copy) => (
              <div key={copy} className="marquee-track" aria-hidden={copy === 1}>
                {row.map((word) => (
                  <Link key={word} to={`/learn?q=${encodeURIComponent(word)}`} className="marquee-word" tabIndex={copy === 1 ? -1 : undefined}>
                    <span aria-hidden="true">✦</span>{word}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="home-section" id="try-it">
        <Reveal className="section-head">
          <span className="eyebrow eyebrow--coral">Try it live</span>
          <h2 className="display section-title">Type it. <em>See it signed.</em></h2>
          <p>The same translator that powers the classroom — whole phrases where a sign exists, fingerspelling where it doesn’t.</p>
        </Reveal>
        <Reveal delay={120}><SignDemo /></Reveal>
      </section>

      <section className="home-section">
        <Reveal className="section-head section-head--split">
          <div>
            <span className="eyebrow">The heart of SignBridge</span>
            <h2 className="display section-title">Room for every way <em>to communicate.</em></h2>
          </div>
          <p>Spoken words, written text and Indian Sign Language — brought into one shared space so understanding is never limited to a single way of expressing yourself.</p>
        </Reveal>

        <div className="bento">
          {features.map((f, i) => {
            const FIcon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 90} className={`bento-cell${f.span === 'wide' ? ' bento-cell--wide' : ''}`}>
                <TiltCard as={Link} to={f.to} className={`bento-card glass-panel tone-${f.tone}`} max={5}>
                  <div className="bento-top">
                    <span className="bento-icon"><FIcon /></span>
                    <span className="bento-kicker mono">{f.kicker}</span>
                    <ArrowUpRightIcon className="bento-go" />
                  </div>
                  <FeatureVisual type={f.visual} />
                  <div className="bento-copy">
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="stats">
          {[
            { value: counts.total, label: 'signs in the dictionary', suffix: '' },
            { value: counts.phrases, label: 'full-phrase animations', suffix: '' },
            { value: 21, label: 'landmarks tracked per hand', suffix: '' },
            { value: 300, label: 'ms between live predictions', suffix: '' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="stat">
              <CountUp value={s.value} suffix={s.suffix} className="stat-value display" />
              <span className="stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="home-section">
        <Reveal className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="display section-title">From a gesture <em>to a voice.</em></h2>
        </Reveal>
        <ol className="pipeline">
          {pipeline.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 120} className="pipeline-step">
              <span className="pipeline-node mono">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="home-section">
        <Reveal variant="scale" className="cta-band glass-panel glass-panel--glow">
          <div className="cta-hand"><HandSkeleton interval={2000} offset={2} /></div>
          <div className="cta-copy">
            <h2 className="display">Come on in. <em>Everyone’s invited.</em></h2>
            <p>Open the classroom, allow your mic or camera, and start a conversation.</p>
          </div>
          <Magnetic>
            <Link className="btn btn--primary btn--lg" to="/classroom">Open the classroom <ArrowIcon /></Link>
          </Magnetic>
        </Reveal>
      </section>
    </div>
  );
};

export default Home;
