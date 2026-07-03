import { getPoseAngles } from "./utils.js";

const base = [
  { x: 0.50, y: 0.16 }, { x: 0.48, y: 0.15 }, { x: 0.47, y: 0.15 },
  { x: 0.46, y: 0.16 }, { x: 0.52, y: 0.15 }, { x: 0.53, y: 0.15 },
  { x: 0.54, y: 0.16 }, { x: 0.45, y: 0.17 }, { x: 0.55, y: 0.17 },
  { x: 0.48, y: 0.21 }, { x: 0.52, y: 0.21 }, { x: 0.38, y: 0.31 },
  { x: 0.62, y: 0.31 }, { x: 0.35, y: 0.48 }, { x: 0.65, y: 0.48 },
  { x: 0.34, y: 0.66 }, { x: 0.66, y: 0.66 }, { x: 0.33, y: 0.70 },
  { x: 0.67, y: 0.70 }, { x: 0.35, y: 0.70 }, { x: 0.65, y: 0.70 },
  { x: 0.34, y: 0.68 }, { x: 0.66, y: 0.68 }, { x: 0.43, y: 0.61 },
  { x: 0.57, y: 0.61 }, { x: 0.41, y: 0.81 }, { x: 0.59, y: 0.81 },
  { x: 0.40, y: 0.98 }, { x: 0.60, y: 0.98 }, { x: 0.38, y: 1.00 },
  { x: 0.62, y: 1.00 }, { x: 0.42, y: 1.02 }, { x: 0.58, y: 1.02 }
];

function pose(name, description, edits) {
  const landmarks = base.map(point => ({ ...point, visibility: 1 }));
  for (const [index, value] of Object.entries(edits)) {
    landmarks[index] = { ...landmarks[index], ...value };
  }
  return { id: name.toLowerCase().replaceAll(" ", "-"), name, description, landmarks, angles: getPoseAngles(landmarks) };
}

export const POSES = [
  pose("Neutral Standing", "Balanced shoulders, relaxed arms, upright body.", {}),
  pose("Hands in Pocket", "Wrists tucked near the hips with a relaxed stance.", {
    13: { x: 0.39, y: 0.48 }, 14: { x: 0.61, y: 0.48 }, 15: { x: 0.45, y: 0.62 }, 16: { x: 0.55, y: 0.62 }
  }),
  pose("Arms Crossed", "Forearms cross over the torso with squared shoulders.", {
    13: { x: 0.45, y: 0.42 }, 14: { x: 0.55, y: 0.42 }, 15: { x: 0.61, y: 0.50 }, 16: { x: 0.39, y: 0.50 }
  }),
  pose("One Hand on Waist", "Left hand rests on the waist while the other arm relaxes.", {
    13: { x: 0.34, y: 0.43 }, 15: { x: 0.43, y: 0.61 }, 14: { x: 0.66, y: 0.47 }, 16: { x: 0.68, y: 0.67 }
  }),
  pose("Victory Sign", "Right hand raised beside the head for a confident peace pose.", {
    14: { x: 0.67, y: 0.24 }, 16: { x: 0.72, y: 0.12 }, 18: { x: 0.73, y: 0.10 }, 20: { x: 0.71, y: 0.10 }, 22: { x: 0.72, y: 0.11 }
  }),
  pose("Walking Pose", "One leg steps forward with a casual arm swing.", {
    13: { x: 0.32, y: 0.45 }, 15: { x: 0.31, y: 0.62 }, 14: { x: 0.67, y: 0.41 }, 16: { x: 0.61, y: 0.56 },
    25: { x: 0.47, y: 0.79 }, 27: { x: 0.52, y: 0.95 }, 26: { x: 0.54, y: 0.80 }, 28: { x: 0.48, y: 1.02 }
  }),
  pose("Looking Away", "Head turns slightly while the body remains composed.", {
    0: { x: 0.43, y: 0.16 }, 1: { x: 0.42, y: 0.15 }, 4: { x: 0.48, y: 0.15 }, 7: { x: 0.39, y: 0.17 }, 8: { x: 0.51, y: 0.17 }
  }),
  pose("Confident Pose", "Wide stance and one hand on hip with open shoulders.", {
    11: { x: 0.36, y: 0.30 }, 12: { x: 0.64, y: 0.30 }, 13: { x: 0.31, y: 0.43 }, 15: { x: 0.43, y: 0.61 },
    23: { x: 0.41, y: 0.61 }, 24: { x: 0.59, y: 0.61 }, 27: { x: 0.35, y: 0.99 }, 28: { x: 0.65, y: 0.99 }
  }),
  pose("Sitting Pose", "Bent knees and lowered hips for a seated portrait.", {
    23: { x: 0.42, y: 0.66 }, 24: { x: 0.58, y: 0.66 }, 25: { x: 0.34, y: 0.78 }, 26: { x: 0.66, y: 0.78 },
    27: { x: 0.29, y: 0.87 }, 28: { x: 0.71, y: 0.87 }, 15: { x: 0.36, y: 0.58 }, 16: { x: 0.64, y: 0.58 }
  }),
  pose("Casual Pose", "Slight lean with relaxed asymmetric arms.", {
    0: { x: 0.47, y: 0.16 }, 11: { x: 0.36, y: 0.31 }, 12: { x: 0.60, y: 0.32 },
    13: { x: 0.34, y: 0.47 }, 15: { x: 0.38, y: 0.63 }, 14: { x: 0.64, y: 0.45 }, 16: { x: 0.59, y: 0.61 },
    23: { x: 0.41, y: 0.62 }, 24: { x: 0.57, y: 0.63 }, 27: { x: 0.39, y: 0.99 }, 28: { x: 0.62, y: 0.98 }
  })
];

export function findPose(id) {
  return POSES.find(poseItem => poseItem.id === id) || POSES[0];
}
