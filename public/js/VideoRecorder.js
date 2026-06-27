// public/js/VideoRecorder.js

class VideoRecorder {
  constructor(editor, audioFile, effect, durationSec, audioContext) {
    this.editor = editor;
    this.audioFile = audioFile;
    this.effect = effect;
    this.duration = durationSec * 1000;
    this.audioContext = audioContext;
  }

  /**
   * 🔥 Try MP4 first (Chrome/Safari), fall back to WebM (Firefox)
   */
  getSupportedMimeType() {
    const types = [
      "video/mp4; codecs=avc1.42E01E,mp4a.40.2", // MP4 (best)
      "video/mp4", // MP4 fallback
      "video/webm; codecs=vp9,opus", // WebM VP9
      "video/webm; codecs=vp8,opus", // WebM VP8
      "video/webm", // Basic WebM
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`✅ Using codec: ${type}`);
        return type;
      }
    }

    throw new Error("No supported video codec found");
  }

  async record() {
    const editor = this.editor;
    const canvas = editor.canvas;
    const ctx = editor.ctx;

    // 1. Setup Audio
    const audioUrl = URL.createObjectURL(this.audioFile);
    const audioElement = new Audio(audioUrl);

    const source = this.audioContext.createMediaElementSource(audioElement);
    const destination = this.audioContext.createMediaStreamDestination();
    source.connect(destination);

    // 2. Setup Video Stream
    const videoStream = canvas.captureStream(30);
    destination.stream
      .getAudioTracks()
      .forEach((track) => videoStream.addTrack(track));

    // 3. 🔥 Get supported codec (MP4 or WebM)
    const mimeType = this.getSupportedMimeType();
    const isMP4 = mimeType.includes("mp4");

    const recorder = new MediaRecorder(videoStream, {
      mimeType: mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps high quality
      audioBitsPerSecond: 192000, // 192 kbps audio
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const stopPromise = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve({ blob, ext: isMP4 ? "mp4" : "webm" });
      };
    });

    // 4. Start Recording
    recorder.start();
    audioElement
      .play()
      .catch((err) => console.warn("Audio play blocked:", err));

    let startTime = null;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 5 + 1,
      speed: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.1,
    }));

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / this.duration;

      if (progress >= 1) {
        recorder.stop();
        audioElement.pause();
        return;
      }

      let textAlpha = 1;
      let textScale = 1;
      const fadeInDuration = 0.15;
      if (progress < fadeInDuration) {
        const p = progress / fadeInDuration;
        const ease = 1 - Math.pow(1 - p, 3);
        textAlpha = ease;
        textScale = 0.8 + 0.2 * ease;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = editor.imageStyle === "none" ? "none" : editor.imageStyle;
      editor.applyEffect(this.effect, progress, timestamp, particles);
      ctx.filter = "none";

      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.translate(editor.textX, editor.textY);
      ctx.scale(textScale, textScale);
      ctx.translate(-editor.textX, -editor.textY);
      editor.drawText();
      ctx.restore();

      editor.drawWatermark();

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    // 5. Wait for recording to finish
    const result = await stopPromise;

    // 6. Cleanup
    URL.revokeObjectURL(audioUrl);
    source.disconnect();

    return result;
  }
}
