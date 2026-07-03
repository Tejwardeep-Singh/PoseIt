import { CameraController } from "./camera.js";
import { captureFrame } from "./capture.js";
import { downloadDataUrl } from "./download.js";
import { assessFrame, makeGuidance } from "./guidance.js";
import { comparePose, drawPoseOverlay, PoseEngine } from "./pose.js";
import { findPose } from "./poseLibrary.js";
import { getBrightness, wait } from "./utils.js";
import {
  defaultSettings,
  populatePoseSelect,
  populateSettings,
  setFilter,
  setStatus,
  updateScore
} from "./ui.js";

const elements = {
  loadingScreen: document.querySelector("#loadingScreen"),
  cameraScreen: document.querySelector("#cameraScreen"),
  previewScreen: document.querySelector("#previewScreen"),
  video: document.querySelector("#cameraVideo"),
  canvas: document.querySelector("#cameraCanvas"),
  countdown: document.querySelector("#countdown"),
  cameraError: document.querySelector("#cameraError"),
  poseSelect: document.querySelector("#poseSelect"),
  filterSelect: document.querySelector("#filterSelect"),
  matchRing: document.querySelector("#matchRing"),
  matchScore: document.querySelector("#matchScore"),
  guidanceBox: document.querySelector("#guidanceBox"),
  faceStatus: document.querySelector("#faceStatus"),
  frameStatus: document.querySelector("#frameStatus"),
  lightStatus: document.querySelector("#lightStatus"),
  manualCaptureButton: document.querySelector("#manualCaptureButton"),
  switchCameraButton: document.querySelector("#switchCameraButton"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsList: document.querySelector("#settingsList"),
  capturedImage: document.querySelector("#capturedImage"),
  downloadButton: document.querySelector("#downloadButton"),
  retakeButton: document.querySelector("#retakeButton"),
  backButton: document.querySelector("#backButton")
};

const settings = loadSettings();
const camera = new CameraController(elements.video);
const sampleCanvas = document.createElement("canvas");
let poseEngine;
let selectedPose = findPose("neutral-standing");
let latestLandmarks = null;
let latestFaceResults = null;
let latestComparison = { similarity: 0, jointScores: {} };
let latestFrame = null;
let capturedDataUrl = "";
let isLooping = false;
let isCapturing = false;
let lastAutoCaptureAt = 0;
let lastBrightnessCheckAt = 0;
let brightness = 0.5;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  populatePoseSelect(elements.poseSelect);
  elements.poseSelect.value = selectedPose.id;
  populateSettings(elements.settingsList, settings, applySetting);
  wireEvents();
  applySetting("darkMode", settings.darkMode);
  applySetting("mirror", settings.mirror);
  applySetting("filters", settings.filters);

  try {
    ensureBrowserSupport();
    poseEngine = new PoseEngine({
      onResults: handlePoseResults,
      onFaceResults: results => { latestFaceResults = results; }
    });
    await poseEngine.init();
    await startCamera();
    hideLoading();
    startLoop();
  } catch (error) {
    hideLoading();
    showError(error.message || "PoseIt could not start the camera.");
  }
}

function wireEvents() {
  elements.poseSelect.addEventListener("change", () => {
    selectedPose = findPose(elements.poseSelect.value);
    elements.guidanceBox.textContent = selectedPose.description;
  });
  elements.filterSelect.addEventListener("change", () => setFilter(elements.video, currentFilter()));
  elements.manualCaptureButton.addEventListener("click", () => beginCapture(false));
  elements.switchCameraButton.addEventListener("click", async () => {
    try {
      await camera.switchCamera();
      applySetting("mirror", settings.mirror);
    } catch (error) {
      showError("This device could not switch cameras. Keep using the active camera.");
    }
  });
  elements.settingsButton.addEventListener("click", () => elements.settingsDialog.showModal());
  elements.downloadButton.addEventListener("click", () => capturedDataUrl && downloadDataUrl(capturedDataUrl));
  elements.retakeButton.addEventListener("click", showCamera);
  elements.backButton.addEventListener("click", showCamera);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", event => {
    if (event.code === "Space" && !elements.cameraScreen.hidden) {
      event.preventDefault();
      beginCapture(false);
    }
    if (event.key === "Escape" && elements.settingsDialog.open) elements.settingsDialog.close();
  });
}

async function startCamera() {
  await camera.start("user");
  resizeCanvas();
  setStatus(elements.faceStatus, "Searching");
  setStatus(elements.frameStatus, "Aligning");
  setStatus(elements.lightStatus, "Checking");
}

function startLoop() {
  if (isLooping) return;
  isLooping = true;
  const tick = async () => {
    if (!isLooping) return;
    try {
      if (!elements.cameraScreen.hidden) await poseEngine.send(elements.video);
    } catch (error) {
      showError("Camera tracking paused. Reload if the camera was disconnected.");
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function handlePoseResults(results) {
  latestLandmarks = results.poseLandmarks || null;
  resizeCanvas();

  const now = performance.now();
  if (now - lastBrightnessCheckAt > 420) {
    brightness = getBrightness(elements.video, sampleCanvas);
    lastBrightnessCheckAt = now;
  }

  latestComparison = latestLandmarks ? comparePose(latestLandmarks, selectedPose) : { similarity: 0, jointScores: {} };
  latestFrame = assessFrame(latestLandmarks, latestFaceResults, brightness);

  drawPoseOverlay(elements.canvas.getContext("2d"), latestLandmarks, selectedPose, {
    width: elements.canvas.width,
    height: elements.canvas.height,
    mirrored: isMirrored(),
    showSkeleton: settings.skeleton,
    showGhost: settings.ghost,
    jointScores: latestComparison.jointScores
  });

  updateInterface();
  maybeAutoCapture(now);
}

function updateInterface() {
  updateScore(latestComparison.similarity, elements.matchRing, elements.matchScore);
  elements.guidanceBox.textContent = makeGuidance({
    landmarks: latestLandmarks,
    targetPose: selectedPose,
    comparison: latestComparison,
    frame: latestFrame
  });
  setStatus(elements.faceStatus, latestFrame.faceVisible ? "Visible" : "Missing", latestFrame.faceVisible);
  setStatus(elements.frameStatus, latestFrame.insideFrame ? "Good" : "Adjust", latestFrame.insideFrame);
  setStatus(elements.lightStatus, latestFrame.lightingGood ? "Good" : latestFrame.tooDark ? "Too dark" : "Bright", latestFrame.lightingGood);
}

function maybeAutoCapture(now) {
  if (!settings.autoCapture || isCapturing || now - lastAutoCaptureAt < 8000) return;
  const ready = latestComparison.similarity >= 95 && latestFrame.faceVisible && latestFrame.insideFrame && latestFrame.lightingGood;
  if (!ready) return;
  lastAutoCaptureAt = now;
  beginCapture(true);
}

async function beginCapture(fromAuto) {
  if (isCapturing || !elements.video.videoWidth) return;
  isCapturing = true;
  try {
    if (settings.countdown && (fromAuto || document.hasFocus())) {
      for (const value of ["3", "2", "1"]) {
        showCountdown(value);
        await wait(820);
      }
      showCountdown("Capture");
      await wait(520);
    }
    capturedDataUrl = captureFrame({
      video: elements.video,
      overlayCanvas: elements.canvas,
      mirrored: isMirrored(),
      includeOverlay: settings.overlayDownload,
      filterName: currentFilter()
    });
    showPreview();
  } finally {
    elements.countdown.textContent = "";
    elements.countdown.classList.remove("is-active");
    isCapturing = false;
  }
}

function showCountdown(value) {
  elements.countdown.classList.remove("is-active");
  void elements.countdown.offsetWidth;
  elements.countdown.textContent = value;
  elements.countdown.classList.add("is-active");
}

function showPreview() {
  elements.capturedImage.src = capturedDataUrl;
  elements.cameraScreen.hidden = true;
  elements.previewScreen.hidden = false;
}

function showCamera() {
  elements.previewScreen.hidden = true;
  elements.cameraScreen.hidden = false;
  requestAnimationFrame(resizeCanvas);
}

function resizeCanvas() {
  const width = elements.video.videoWidth || elements.canvas.clientWidth;
  const height = elements.video.videoHeight || elements.canvas.clientHeight;
  if (!width || !height) return;
  if (elements.canvas.width !== width || elements.canvas.height !== height) {
    elements.canvas.width = width;
    elements.canvas.height = height;
  }
}

function currentFilter() {
  return settings.filters ? elements.filterSelect.value : "none";
}

function applySetting(key, value) {
  if (key === "darkMode") document.body.classList.toggle("light-mode", !value);
  if (key === "mirror") {
    const scale = value && camera.isFrontCamera() ? -1 : 1;
    elements.video.style.setProperty("--mirror-scale", scale);
  }
  if (key === "filters") {
    elements.filterSelect.disabled = !value;
    setFilter(elements.video, currentFilter());
  }
  localStorage.setItem("poseit-settings", JSON.stringify(settings));
}

function isMirrored() {
  return settings.mirror && camera.isFrontCamera();
}

function showError(message) {
  elements.cameraError.hidden = false;
  elements.cameraError.textContent = message;
  elements.guidanceBox.textContent = message;
}

function hideLoading() {
  elements.loadingScreen.classList.add("is-hidden");
}

function ensureBrowserSupport() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera access. Try the latest Chrome, Edge, Firefox, or Safari.");
  }
  if (!window.isSecureContext && location.protocol !== "http:" && location.hostname !== "localhost") {
    throw new Error("Camera access requires HTTPS or localhost in most browsers.");
  }
}

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem("poseit-settings") || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}
