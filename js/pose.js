import { ANGLE_JOINTS, POSE_CONNECTIONS, averageVisibility, clamp, getPoseAngles, scaleLandmark } from "./utils.js";

export class PoseEngine {
  constructor({ onResults, onFaceResults }) {
    this.onResults = onResults;
    this.onFaceResults = onFaceResults;
    this.pose = null;
    this.face = null;
  }

  async init() {
    if (!window.Pose || !window.FaceDetection) {
      throw new Error("MediaPipe could not be loaded. Check your internet connection and reload.");
    }
    this.pose = new window.Pose({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55
    });
    this.pose.onResults(this.onResults);

    this.face = new window.FaceDetection({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });
    this.face.setOptions({ model: "short", minDetectionConfidence: 0.55 });
    this.face.onResults(this.onFaceResults);
  }

  async send(video) {
    if (!this.pose || !this.face || !video.videoWidth) return;
    await this.pose.send({ image: video });
    await this.face.send({ image: video });
  }
}

export function comparePose(currentLandmarks, targetPose) {
  const currentAngles = getPoseAngles(currentLandmarks);
  let total = 0;
  let count = 0;
  const jointScores = {};

  for (const [name] of ANGLE_JOINTS) {
    if (currentAngles[name] === undefined || targetPose.angles[name] === undefined) continue;
    const diff = Math.abs(currentAngles[name] - targetPose.angles[name]);
    const score = clamp(1 - diff / 90, 0, 1);
    jointScores[name] = score;
    total += score;
    count += 1;
  }

  const visibilityBoost = clamp(averageVisibility(currentLandmarks), 0, 1);
  const similarity = count ? Math.round((total / count) * 100 * (0.75 + visibilityBoost * 0.25)) : 0;
  return { similarity, currentAngles, jointScores };
}

export function drawPoseOverlay(ctx, landmarks, targetPose, options) {
  const { width, height, mirrored, showSkeleton, showGhost, jointScores } = options;
  ctx.clearRect(0, 0, width, height);
  if (showGhost) drawSkeleton(ctx, targetPose.landmarks, width, height, true, mirrored);
  if (showSkeleton && landmarks?.length) drawSkeleton(ctx, landmarks, width, height, false, mirrored, jointScores);
  if (showGhost && landmarks?.length) drawMovementArrows(ctx, landmarks, targetPose.landmarks, width, height, mirrored);
}

function drawSkeleton(ctx, landmarks, width, height, ghost, mirrored, jointScores = {}) {
  const alpha = ghost ? 0.36 : 0.92;
  ctx.save();
  ctx.lineWidth = ghost ? 5 : 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [a, b] of POSE_CONNECTIONS) {
    const startRaw = landmarks[a];
    const endRaw = landmarks[b];
    if (!startRaw || !endRaw) continue;
    if (!ghost && ((startRaw.visibility ?? 1) < 0.45 || (endRaw.visibility ?? 1) < 0.45)) continue;
    const start = scaleLandmark(startRaw, width, height, mirrored);
    const end = scaleLandmark(endRaw, width, height, mirrored);
    ctx.strokeStyle = ghost ? `rgba(255, 207, 90, ${alpha})` : jointColor(a, b, jointScores, alpha);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  for (let index = 0; index < landmarks.length; index += 1) {
    const pointRaw = landmarks[index];
    if (!pointRaw || (!ghost && (pointRaw.visibility ?? 1) < 0.45)) continue;
    const point = scaleLandmark(pointRaw, width, height, mirrored);
    ctx.fillStyle = ghost ? `rgba(255, 207, 90, ${alpha + 0.18})` : "rgba(244, 251, 248, 0.94)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, ghost ? 5 : 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function jointColor(a, b, scores, alpha) {
  const score = Object.entries(scores).find(([name]) => {
    if (name.includes("Elbow")) return [13, 14, 15, 16].includes(a) || [13, 14, 15, 16].includes(b);
    if (name.includes("Shoulder")) return [11, 12, 13, 14].includes(a) || [11, 12, 13, 14].includes(b);
    if (name.includes("Knee")) return [25, 26, 27, 28].includes(a) || [25, 26, 27, 28].includes(b);
    return false;
  })?.[1] ?? 0.7;
  return score > 0.78 ? `rgba(98, 240, 155, ${alpha})` : `rgba(255, 95, 102, ${alpha})`;
}

function drawMovementArrows(ctx, current, target, width, height, mirrored) {
  const indexes = [0, 15, 16, 23, 24, 27, 28];
  ctx.save();
  ctx.strokeStyle = "rgba(102, 183, 255, 0.72)";
  ctx.fillStyle = "rgba(102, 183, 255, 0.78)";
  ctx.lineWidth = 2;
  for (const index of indexes) {
    if (!current[index] || !target[index] || (current[index].visibility ?? 1) < 0.45) continue;
    const from = scaleLandmark(current[index], width, height, mirrored);
    const to = scaleLandmark(target[index], width, height, mirrored);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.hypot(dx, dy) < 34) continue;
    const end = { x: from.x + dx * 0.22, y: from.y + dy * 0.22 };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
