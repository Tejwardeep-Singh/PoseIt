import { KEYPOINTS, averageVisibility, clamp, getBoundingBox } from "./utils.js";

export function assessFrame(landmarks, faceResults, brightness) {
  const box = getBoundingBox(landmarks);
  const face = faceResults?.detections?.[0] || null;
  const faceBox = face?.boundingBox;
  const faceVisible = Boolean(face);
  const visibility = averageVisibility(landmarks);
  const insideFrame = Boolean(box && box.minX > 0.03 && box.maxX < 0.97 && box.minY > 0.02 && box.maxY < 1.04 && visibility > 0.54);
  const centered = Boolean(box && Math.abs(box.centerX - 0.5) < 0.16);
  const fullBody = Boolean(box && box.height > 0.52);
  const faceCentered = Boolean(faceBox && Math.abs((faceBox.xCenter ?? 0.5) - 0.5) < 0.18);
  const faceSize = faceBox ? Math.max(faceBox.width ?? 0, faceBox.height ?? 0) : 0;
  const lightingGood = brightness > 0.26 && brightness < 0.82;

  return {
    box,
    faceVisible,
    faceCentered,
    faceSize,
    insideFrame,
    centered,
    fullBody,
    visibility,
    lightingGood,
    tooDark: brightness <= 0.26,
    tooBright: brightness >= 0.82
  };
}

export function makeGuidance({ landmarks, targetPose, comparison, frame }) {
  if (!landmarks?.length || frame.visibility < 0.2) return "Step into frame so PoseIt can see your body.";
  if (!frame.faceVisible) return "Show your face to the camera.";
  if (!frame.faceCentered) return "Center your face in the frame.";
  if (!frame.centered) return frame.box?.centerX < 0.5 ? "Move slightly right." : "Move slightly left.";
  if (!frame.insideFrame) return "Keep your full body inside the frame.";
  if (!frame.fullBody) return "Move farther from the camera.";
  if (frame.faceSize > 0.34) return "Move slightly backward.";
  if (frame.faceSize && frame.faceSize < 0.08) return "Move closer.";
  if (frame.tooDark) return "Move toward better light.";
  if (frame.tooBright) return "Step away from the brightest light.";
  if (comparison.similarity >= 95) return "Perfect! Hold still.";

  const wristHint = limbHint(landmarks, targetPose.landmarks);
  if (wristHint) return wristHint;

  const shoulderDelta = shoulderTilt(landmarks);
  if (Math.abs(shoulderDelta) > 0.055) return shoulderDelta > 0 ? "Lower your left shoulder." : "Lower your right shoulder.";

  const nose = landmarks[KEYPOINTS.nose];
  const targetNose = targetPose.landmarks[KEYPOINTS.nose];
  if (nose && targetNose && Math.abs(nose.x - targetNose.x) > 0.055) {
    return nose.x > targetNose.x ? "Tilt your head left." : "Tilt your head right.";
  }

  return comparison.similarity > 84 ? "Almost there. Hold the pose steady." : targetPose.description;
}

function limbHint(current, target) {
  const checks = [
    [KEYPOINTS.leftWrist, "left arm"],
    [KEYPOINTS.rightWrist, "right arm"],
    [KEYPOINTS.leftKnee, "left knee"],
    [KEYPOINTS.rightKnee, "right knee"]
  ];
  for (const [index, label] of checks) {
    const now = current[index];
    const goal = target[index];
    if (!now || !goal || (now.visibility ?? 1) < 0.45) continue;
    const dx = goal.x - now.x;
    const dy = goal.y - now.y;
    if (Math.hypot(dx, dy) < 0.09) continue;
    if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? `Raise your ${label}.` : `Lower your ${label}.`;
    return dx < 0 ? `Move your ${label} left.` : `Move your ${label} right.`;
  }
  return "";
}

function shoulderTilt(landmarks) {
  const left = landmarks[KEYPOINTS.leftShoulder];
  const right = landmarks[KEYPOINTS.rightShoulder];
  if (!left || !right) return 0;
  return clamp(left.y - right.y, -1, 1);
}
