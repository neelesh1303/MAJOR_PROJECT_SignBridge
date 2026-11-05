import React, { useEffect, useId, useRef } from 'react';
import { FINGERTIPS, HAND_BONES, HAND_POSES, computeLandmarks } from './handPoses';

const PALETTES = [
  { bone: '#7bd8bd', joint: '#3fcba3', tip: '#82c8f2' },
  { bone: '#f2a17b', joint: '#f3c078', tip: '#f7d9a8' },
];

const lerpPose = (from, to, k) => ({
  curl: from.curl.map((v, i) => v + (to.curl[i] - v) * k),
  spread: from.spread + (to.spread - from.spread) * k,
});

/**
 * Animated landmark hand(s) that morph between ISL handshapes.
 * hands=2 renders a mirrored second hand and a connection beam between index tips.
 */
const HandSkeleton = ({
  hands = 1,
  interval = 2400,
  poses = HAND_POSES,
  offset = 3,
  onPose,
  className = '',
  title = 'Animated hand landmark skeleton',
}) => {
  const uid = useId().replace(/:/g, '');
  const boneRefs = useRef([[], []]);
  const jointRefs = useRef([[], []]);
  const beamRef = useRef(null);
  const onPoseRef = useRef(onPose);
  onPoseRef.current = onPose;

  const width = hands === 2 ? 400 : 200;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let poseIndex = 0;
    const current = [
      { curl: [...poses[0].curl], spread: poses[0].spread },
      { curl: [...poses[offset % poses.length].curl], spread: poses[offset % poses.length].spread },
    ];
    let targets = [poses[0], poses[offset % poses.length]];
    let last = performance.now();
    let raf = 0;

    const render = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
      const wobble = reduced ? 0 : Math.sin(now / 900);
      const tips = [];

      for (let h = 0; h < hands; h++) {
        current[h] = lerpPose(current[h], targets[h], k);
        const pts = computeLandmarks(current[h].curl, current[h].spread, h ? -wobble : wobble);
        const shift = 10;
        const place = h === 0
          ? ([x, y]) => [x + shift, y]
          : ([x, y]) => [width - (x + shift), y];
        const placed = pts.map(place);
        tips.push(placed[8]);

        HAND_BONES.forEach(([a, b], i) => {
          const line = boneRefs.current[h][i];
          if (!line) return;
          line.setAttribute('x1', placed[a][0]);
          line.setAttribute('y1', placed[a][1]);
          line.setAttribute('x2', placed[b][0]);
          line.setAttribute('y2', placed[b][1]);
        });
        placed.forEach(([x, y], i) => {
          const dot = jointRefs.current[h][i];
          if (!dot) return;
          dot.setAttribute('cx', x);
          dot.setAttribute('cy', y);
        });
      }

      if (hands === 2 && beamRef.current) {
        beamRef.current.setAttribute('x1', tips[0][0]);
        beamRef.current.setAttribute('y1', tips[0][1]);
        beamRef.current.setAttribute('x2', tips[1][0]);
        beamRef.current.setAttribute('y2', tips[1][1]);
      }

      raf = requestAnimationFrame(render);
    };

    onPoseRef.current?.(poses[0], 0);
    raf = requestAnimationFrame(render);
    const timer = setInterval(() => {
      poseIndex = (poseIndex + 1) % poses.length;
      targets = [poses[poseIndex], poses[(poseIndex + offset) % poses.length]];
      onPoseRef.current?.(poses[poseIndex], poseIndex);
    }, interval);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [hands, interval, poses, offset, width]);

  return (
    <svg
      className={`hand-skeleton ${className}`}
      viewBox={`0 4 ${width} 234`}
      role="img"
      aria-label={title}
    >
      <defs>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {hands === 2 && (
        <line ref={beamRef} className="beam" stroke="#82c8f2" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
      )}

      {Array.from({ length: hands }, (_, h) => {
        const palette = PALETTES[h];
        return (
          <g key={h} filter={`url(#glow-${uid})`}>
            {HAND_BONES.map((_, i) => (
              <line
                key={i}
                ref={(el) => { boneRefs.current[h][i] = el; }}
                className="bone"
                stroke={palette.bone}
                strokeOpacity=".92"
              />
            ))}
            {Array.from({ length: 21 }, (_, i) => {
              const isTip = FINGERTIPS.includes(i);
              return (
                <circle
                  key={i}
                  ref={(el) => { jointRefs.current[h][i] = el; }}
                  className={`joint${isTip ? ' tip' : ''}`}
                  r={i === 0 ? 6.5 : isTip ? 5.2 : 3.6}
                  fill={isTip ? palette.tip : palette.joint}
                  style={isTip ? { animationDelay: `${i * -0.18}s` } : undefined}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

export default HandSkeleton;
