import { formatFilename } from "./utils.js";

export function downloadDataUrl(dataUrl) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = formatFilename();
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
