import React from 'react';
import { Link } from 'react-router-dom';
import HandSkeleton from '../components/fx/HandSkeleton';
import { ArrowIcon } from '../components/fx/Icons';

const LOST_POSES = [
  { label: '?', curl: [0.85, 0, 1, 1, 1], spread: 0.25 },
  { label: '?', curl: [0, 0, 0, 0, 0], spread: 1 },
];

const NotFound = () => (
  <section className="not-found">
    <div className="not-found-inner">
      <div className="hand-wrap"><HandSkeleton poses={LOST_POSES} interval={1400} title="A hand waving, looking for the page" /></div>
      <span className="eyebrow eyebrow--coral">Error 404</span>
      <h1 className="display">Lost in <em>translation.</em></h1>
      <p>We searched every sign, word and letter, but this page doesn’t exist. Let’s get you back to the conversation.</p>
      <Link to="/" className="btn btn--primary">Back home <ArrowIcon /></Link>
    </div>
  </section>
);

export default NotFound;
