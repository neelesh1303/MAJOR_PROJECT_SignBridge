// Procedural 21-point hand (MediaPipe landmark order) driven by finger curl values.
// 0 wrist · 1-4 thumb · 5-8 index · 9-12 middle · 13-16 ring · 17-20 pinky

export const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export const FINGERTIPS = [4, 8, 12, 16, 20];

// Curl order: [thumb, index, middle, ring, pinky], each 0 (straight) → 1 (folded).
export const HAND_POSES = [
  { label: 'HELLO', curl: [0, 0, 0, 0, 0], spread: 1 },
  { label: 'A', curl: [0.3, 1, 1, 1, 1], spread: 0 },
  { label: 'V', curl: [0.9, 0, 0, 1, 1], spread: 1 },
  { label: 'I LOVE YOU', curl: [0, 0, 1, 1, 0], spread: 1 },
  { label: 'YOU', curl: [0.85, 0, 1, 1, 1], spread: 0.25 },
  { label: 'L', curl: [0, 0, 1, 1, 1], spread: 0.4 },
  { label: 'OK', curl: [0.62, 0.6, 0, 0, 0], spread: 0.85 },
  { label: 'Y', curl: [0, 1, 1, 1, 0], spread: 1 },
];

const WRIST = [104, 214];
const FINGERS = [
  { mcp: [80, 120], angle: -95, fan: -13, len: [36, 25, 20] },
  { mcp: [100, 113], angle: -90, fan: -3, len: [41, 27, 21] },
  { mcp: [118, 118], angle: -85, fan: 8, len: [37, 25, 20] },
  { mcp: [134, 130], angle: -79, fan: 17, len: [29, 20, 17] },
];
const BEND = [82, 100, 72];
const THUMB = { cmc: [84, 194], open: -146, closed: -62, len: [27, 24, 20] };
const THUMB_BEND = [10, 34, 40];

const rad = (deg) => (deg * Math.PI) / 180;

export const computeLandmarks = (curl, spread, wobble = 0) => {
  const pts = new Array(21);
  pts[0] = WRIST;

  // Thumb sweeps across the palm as it curls.
  const t = curl[0];
  const tDir = rad(THUMB.open + (THUMB.closed - THUMB.open) * t + wobble * 4);
  let tx = THUMB.cmc[0];
  let ty = THUMB.cmc[1];
  pts[1] = [tx, ty];
  let tPhi = 0;
  THUMB.len.forEach((len, i) => {
    tPhi += rad(THUMB_BEND[i] * t);
    const step = len * Math.cos(tPhi);
    tx += Math.cos(tDir) * step;
    ty += Math.sin(tDir) * step;
    pts[2 + i] = [tx, ty];
  });

  FINGERS.forEach((finger, f) => {
    const c = curl[f + 1];
    const dir = rad(finger.angle + finger.fan * spread + wobble * (f - 1.5) * 1.5);
    let x = finger.mcp[0] + finger.fan * spread * 0.35;
    let y = finger.mcp[1];
    const base = 5 + f * 4;
    pts[base] = [x, y];
    let phi = 0;
    finger.len.forEach((len, i) => {
      phi += rad(BEND[i] * c);
      // Front-on projection: folding toward the palm foreshortens the segment.
      const step = len * Math.cos(phi);
      x += Math.cos(dir) * step;
      y += Math.sin(dir) * step;
      pts[base + 1 + i] = [x, y];
    });
  });

  return pts;
};
