# PoseIt - AI Photography Assistant

PoseIt is a browser-only AI camera app that guides a person into polished portrait poses, compares live body landmarks against target poses, and captures a high-quality photo when the pose, face framing, and lighting are ready.

## Features

- Real-time webcam preview with MediaPipe Pose skeleton rendering
- Ten predefined target poses with normalized joint-angle matching
- Semi-transparent ghost skeleton, joint correctness colors, and movement arrows
- Live pose similarity score from 0-100%
- Guidance for arms, shoulders, head tilt, body position, distance, framing, and lighting
- Face detection and centering checks with MediaPipe Face Detection
- Automatic capture at 95%+ pose match when face, framing, and lighting are valid
- Manual shutter capture, animated countdown, preview screen, retake, and download
- Optional filters: Original, Warm, Cool, Portrait, Black & White, and Vintage
- Settings for skeletons, ghost pose, auto capture, countdown, mirroring, overlay download, filters, and dark mode
- Fully responsive layout for desktop and mobile browsers

## Screenshots

Add screenshots of the camera view, guidance state, and preview screen here after running PoseIt locally.

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript with ES6 modules
- MediaPipe Pose
- MediaPipe Face Detection
- HTML5 Canvas
- Browser Camera API, `getUserMedia`

## Installation

No package installation is required. PoseIt is a static web app.

## How To Run

Run the project through a local development server so ES modules and camera permissions work correctly.

With VS Code Live Server:

1. Open this folder in VS Code.
2. Start Live Server from `index.html`.
3. Allow camera permission in the browser.

With Python:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Project Structure

```text
poseit/
├── index.html
├── css/
│   ├── styles.css
│   ├── camera.css
│   ├── ui.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── camera.js
│   ├── pose.js
│   ├── guidance.js
│   ├── capture.js
│   ├── download.js
│   ├── poseLibrary.js
│   ├── ui.js
│   └── utils.js
├── assets/
│   ├── icons/
│   ├── poses/
│   └── logo/
└── README.md
```

## Browser Notes

Camera access generally requires `localhost` or HTTPS. Mobile browsers may offer front and rear cameras; the switch button requests the alternate camera when available. MediaPipe model files are loaded in the browser from the official npm CDN package.

## Future Improvements

- Add Face Mesh for eye-open and smile checks
- Save custom poses from a live frame
- Add a gallery for multiple captures
- Add camera exposure and white-balance hints where supported
- Add PWA offline caching for app shell assets

## License

MIT
