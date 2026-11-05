import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/fx/Reveal';
import TiltCard from '../components/fx/TiltCard';
import HandSkeleton from '../components/fx/HandSkeleton';
import {
  ArrowIcon, LayersIcon, CpuIcon, GlobeIcon, ServerIcon, MicIcon, SparkleIcon, CameraIcon,
} from '../components/fx/Icons';
import './About.css';

const BRIDGES = [
  { icon: MicIcon, from: 'Speech', to: 'Text', tone: 'coral', body: 'Live captions from the teacher’s voice using the Web Speech API.' },
  { icon: SparkleIcon, from: 'Text', to: 'Sign', tone: 'sky', body: 'Phrases map to ISL animations; unknown words are fingerspelled.' },
  { icon: CameraIcon, from: 'Sign', to: 'Text', tone: 'mint', body: 'Webcam landmarks are classified into one- and two-handed signs.' },
];

const STACK = [
  { icon: LayersIcon, title: 'Frontend', body: 'React + Vite + Tailwind', tone: 'sky' },
  { icon: CpuIcon, title: 'AI / Machine Learning', body: 'MediaPipe + OpenCV + scikit-learn', tone: 'mint' },
  { icon: GlobeIcon, title: 'Browser APIs', body: 'Web Speech API + Speech Synthesis', tone: 'violet' },
  { icon: ServerIcon, title: 'Backend', body: 'Python + FastAPI', tone: 'coral' },
];

const FUTURE = [
  'Larger ISL dataset',
  'Continuous sentence recognition',
  'Facial-expression recognition',
  'Better temporal models',
  'Multilingual speech',
  'Teacher/student classroom accounts',
  'Progress tracking',
  'Real-time collaborative classroom',
  'Mobile application',
];

const About = () => {
  return (
    <div className="page about">
      <section className="about-hero">
        <Reveal className="page-head">
          <span className="eyebrow">About SignBridge</span>
          <h1 className="display">Building bridges in education through <em>Indian Sign Language.</em></h1>
          <p className="lead">An assistive classroom platform that lets hearing, Deaf, hard-of-hearing and non-speaking learners understand each other in real time.</p>
        </Reveal>
        <Reveal variant="right" delay={150} className="about-hero-art glass-panel">
          <div className="hud-grid" />
          <div className="hud-corners"><i /><i /><i /><i /></div>
          <HandSkeleton hands={2} interval={2200} offset={5} />
        </Reveal>
      </section>

      <section className="about-split">
        <Reveal variant="left" className="about-card glass-panel tone-coral">
          <span className="about-card-n mono">01 — The problem</span>
          <h2 className="display">A room full of people, <em>not all of them heard.</em></h2>
          <p>
            Traditional classrooms can create communication barriers for Deaf and hard-of-hearing students.
            When teachers speak, non-hearing students may miss critical information, and when non-speaking
            students try to communicate, hearing peers and teachers may not understand their signs.
          </p>
        </Reveal>
        <Reveal variant="right" delay={100} className="about-card glass-panel tone-mint">
          <span className="about-card-n mono">02 — The solution</span>
          <h2 className="display">One shared space, <em>every way of speaking.</em></h2>
          <p>
            SignBridge provides speech-to-text, text-to-sign and sign-to-text assistance inside a common
            classroom environment. By using a controlled-vocabulary ISL assistive communication platform,
            everyone can participate seamlessly.
          </p>
        </Reveal>
      </section>

      <section className="about-section">
        <Reveal className="section-head-sm">
          <span className="eyebrow">Three bridges</span>
          <h2 className="display">How a message <em>crosses over.</em></h2>
        </Reveal>
        <div className="bridges">
          {BRIDGES.map((b, i) => {
            const BIcon = b.icon;
            return (
              <Reveal key={b.from + b.to} delay={i * 120} className={`bridge tone-${b.tone}`}>
                <span className="bridge-icon"><BIcon /></span>
                <span className="bridge-flow mono">{b.from} <i aria-hidden="true" /> {b.to}</span>
                <p>{b.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="about-section">
        <Reveal className="section-head-sm">
          <span className="eyebrow">Technology</span>
          <h2 className="display">What powers <em>the bridge.</em></h2>
        </Reveal>
        <div className="stack">
          {STACK.map((s, i) => {
            const SIcon = s.icon;
            return (
              <Reveal key={s.title} delay={i * 90} variant="scale">
                <TiltCard className={`stack-card glass-panel tone-${s.tone}`} max={9}>
                  <span className="stack-icon"><SIcon /></span>
                  <h3>{s.title}</h3>
                  <p className="mono">{s.body}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="about-section">
        <Reveal className="section-head-sm">
          <span className="eyebrow eyebrow--coral">Future scope</span>
          <h2 className="display">Where we’re <em>headed next.</em></h2>
        </Reveal>
        <ol className="roadmap">
          {FUTURE.map((item, i) => (
            <Reveal as="li" key={item} delay={(i % 3) * 90} className="roadmap-item">
              <span className="roadmap-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </Reveal>
          ))}
        </ol>
      </section>

      <Reveal variant="scale" className="about-cta glass-panel glass-panel--glow">
        <h2 className="display">See it in action.</h2>
        <Link to="/classroom" className="btn btn--primary btn--lg">Open the classroom <ArrowIcon /></Link>
      </Reveal>
    </div>
  );
};

export default About;
