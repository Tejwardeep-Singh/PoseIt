export const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [18, 20], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [27, 29], [27, 31], [29, 31], [24, 26], [26, 28], [28, 30],
  [28, 32], [30, 32], [0, 1], [1, 2], [2, 3], [3, 7], [0, 4],
  [4, 5], [5, 6], [6, 8], [9, 10]
];

export const KEYPOINTS = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28
};

export const ANGLE_JOINTS = [
  ["leftElbow", 11, 13, 15],
  ["rightElbow", 12, 14, 16],
  ["leftShoulder", 13, 11, 23],
  ["rightShoulder", 14, 12, 24],
  ["leftHip", 11, 23, 25],
  ["rightHip", 12, 24, 26],
  ["leftKnee", 23, 25, 27],
  ["rightKnee", 24, 26, 28],
  ["torsoLean", 0, 23, 24]
];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function angleBetween(a, b, c) {
  if (!a || !b || !c) return null;
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLen = Math.hypot(ab.x, ab.y);
  const cbLen = Math.hypot(cb.x, cb.y);
  if (!abLen || !cbLen) return null;
  const cosine = clamp(dot / (abLen * cbLen), -1, 1);
  return Math.acos(cosine) * 180 / Math.PI;
}

export function getPoseAngles(landmarks) {
  const angles = {};
  for (const [name, a, b, c] of ANGLE_JOINTS) {
    const angle = angleBetween(landmarks?.[a], landmarks?.[b], landmarks?.[c]);
    if (angle !== null) angles[name] = angle;
  }
  return angles;
}

export function averageVisibility(landmarks) {
  if (!landmarks?.length) return 0;
  const required = Object.values(KEYPOINTS);
  const total = required.reduce((sum, index) => sum + (landmarks[index]?.visibility ?? 0), 0);
  return total / required.length;
}

export function scaleLandmark(point, width, height, mirrored = false) {
  return {
    x: (mirrored ? 1 - point.x : point.x) * width,
    y: point.y * height
  };
}

export function formatFilename(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");
  const time = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("-");
  return `photo_${stamp}_${time}.png`;
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getBrightness(video, sampleCanvas) {
  if (!video.videoWidth || !video.videoHeight) return 0;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleCanvas.width = 64;
  sampleCanvas.height = 36;
  context.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const { data } = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255;
  }
  return total / (data.length / 4);
}

export function getBoundingBox(landmarks) {
  const visible = (landmarks || []).filter(point => (point.visibility ?? 1) > 0.45);
  if (!visible.length) return null;
  const xs = visible.map(point => point.x);
  const ys = visible.map(point => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    centerY: (Math.min(...ys) + Math.max(...ys)) / 2
  };
}
