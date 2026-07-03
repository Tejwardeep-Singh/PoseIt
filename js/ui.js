import { POSES } from "./poseLibrary.js";

export const defaultSettings = {
  skeleton: true,
  ghost: true,
  autoCapture: true,
  countdown: true,
  mirror: true,
  overlayDownload: false,
  filters: true,
  darkMode: true
};

const settingLabels = {
  skeleton: "Enable Skeleton",
  ghost: "Enable Ghost Pose",
  autoCapture: "Enable Auto Capture",
  countdown: "Enable Countdown",
  mirror: "Mirror Preview",
  overlayDownload: "Enable Overlay in Download",
  filters: "Enable Filters",
  darkMode: "Dark Mode"
};

export function populatePoseSelect(select) {
  select.innerHTML = "";
  for (const pose of POSES) {
    const option = document.createElement("option");
    option.value = pose.id;
    option.textContent = pose.name;
    select.append(option);
  }
}

export function populateSettings(container, settings, onChange) {
  container.innerHTML = "";
  for (const key of Object.keys(defaultSettings)) {
    const label = document.createElement("label");
    label.className = "toggle-row";
    const span = document.createElement("span");
    span.textContent = settingLabels[key];
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settings[key];
    input.addEventListener("change", () => {
      settings[key] = input.checked;
      onChange(key, input.checked);
    });
    label.append(span, input);
    container.append(label);
  }
}

export function updateScore(score, ring, label) {
  const circumference = 326.73;
  ring.style.strokeDashoffset = String(circumference - (score / 100) * circumference);
  ring.style.stroke = score >= 95 ? "var(--good)" : score >= 75 ? "var(--accent-2)" : "var(--accent)";
  label.textContent = `${score}%`;
}

export function setStatus(element, value, good = false) {
  element.textContent = value;
  element.style.color = good ? "var(--good)" : "var(--text)";
}

export function setFilter(video, filterName) {
  const filters = {
    none: "none",
    warm: "saturate(1.08) sepia(0.16) brightness(1.04)",
    cool: "saturate(1.05) hue-rotate(8deg) brightness(1.02)",
    portrait: "contrast(1.04) saturate(1.12) brightness(1.06)",
    mono: "grayscale(1) contrast(1.06)",
    vintage: "sepia(0.28) saturate(0.92) contrast(1.05)"
  };
  video.style.setProperty("--active-filter", filters[filterName] || "none");
}
