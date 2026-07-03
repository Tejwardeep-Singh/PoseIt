export function applyFilterToCanvas(ctx, width, height, filterName) {
  if (filterName === "none") return;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (filterName === "warm") {
      r *= 1.08; g *= 1.02; b *= 0.92;
    } else if (filterName === "cool") {
      r *= 0.92; g *= 1.02; b *= 1.12;
    } else if (filterName === "portrait") {
      r = r * 1.06 + 8; g = g * 1.04 + 6; b = b * 1.01 + 4;
    } else if (filterName === "mono") {
      const gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
      r = g = b = gray;
    } else if (filterName === "vintage") {
      const nr = r * 0.92 + g * 0.16 + b * 0.08 + 8;
      const ng = r * 0.08 + g * 0.88 + b * 0.08 + 4;
      const nb = r * 0.04 + g * 0.12 + b * 0.78;
      r = nr; g = ng; b = nb;
    }
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(image, 0, 0);
}

export function captureFrame({ video, overlayCanvas, mirrored, includeOverlay, filterName }) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (mirrored) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, width, height);
  if (mirrored) ctx.setTransform(1, 0, 0, 1, 0, 0);
  applyFilterToCanvas(ctx, width, height, filterName);
  if (includeOverlay) {
    ctx.drawImage(overlayCanvas, 0, 0, width, height);
  }
  return canvas.toDataURL("image/png", 1);
}
