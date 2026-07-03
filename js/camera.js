export class CameraController {
  constructor(video) {
    this.video = video;
    this.stream = null;
    this.facingMode = "user";
  }

  async start(facingMode = this.facingMode) {
    this.stop();
    this.facingMode = facingMode;
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 60, max: 60 }
      }
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    await this.video.play();
    return this.stream;
  }

  stop() {
    if (!this.stream) return;
    for (const track of this.stream.getTracks()) track.stop();
    this.stream = null;
  }

  async switchCamera() {
    const next = this.facingMode === "user" ? "environment" : "user";
    return this.start(next);
  }

  isFrontCamera() {
    return this.facingMode === "user";
  }
}
