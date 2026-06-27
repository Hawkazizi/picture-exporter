// public/js/VideoConverter.js

class VideoConverter {
  constructor() {
    this.ffmpeg = null;
    this.isLoaded = false;
    this.loadPromise = null;
  }

  async load() {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const { FFmpeg } = FFmpegWASM;
        this.ffmpeg = new FFmpeg();

        this.ffmpeg.on("log", ({ message }) => {
          console.log("[FFmpeg]", message);
        });

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await this.ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        });

        this.isLoaded = true;
        console.log("✅ FFmpeg.wasm loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load FFmpeg.wasm:", error);
        throw error;
      }
    })();

    return this.loadPromise;
  }

  /**
   * 🔥 Calculate optimal bitrate to hit target file size (5-8 MB)
   * @param {number} durationSec - Video duration in seconds
   * @returns {string} Bitrate string for FFmpeg (e.g., "8000k")
   */
  calculateBitrate(durationSec) {
    const targetSizeMB = 6.5; // Target middle of 5-8 MB range
    const targetSizeBits = targetSizeMB * 8 * 1024 * 1024;
    const audioBitrate = 128000; // 128 kbps

    // Calculate video bitrate
    let videoBitrate = Math.floor(targetSizeBits / durationSec - audioBitrate);

    // Clamp between 2 Mbps and 15 Mbps for quality control
    videoBitrate = Math.max(2000000, Math.min(15000000, videoBitrate));

    // Convert to kbps for FFmpeg
    const videoBitrateKbps = Math.floor(videoBitrate / 1000);

    return `${videoBitrateKbps}k`;
  }

  /**
   * Convert WebM blob to MP4 with controlled bitrate
   * @param {Blob} webmBlob - WebM video blob
   * @param {number} durationSec - Duration in seconds
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Promise<Blob>} MP4 blob
   */
  async convertToMP4(webmBlob, durationSec, progressCallback) {
    await this.load();

    if (progressCallback) {
      progressCallback("Converting to MP4...");
    }

    const { fetchFile } = FFmpegUtil;

    // Generate unique filenames
    const inputName = `input_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    const outputName = `output_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;

    // Write input file to FFmpeg virtual filesystem
    await this.ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

    // Calculate optimal bitrate for target size
    const videoBitrate = this.calculateBitrate(durationSec);

    // 🔥 FFmpeg command to convert WebM to MP4 with controlled bitrate
    await this.ffmpeg.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264", // H.264 video codec
      "-b:v",
      videoBitrate, // Controlled video bitrate
      "-maxrate",
      videoBitrate, // Maximum bitrate
      "-bufsize",
      "2000k", // Buffer size
      "-c:a",
      "aac", // AAC audio codec
      "-b:a",
      "128k", // 128 kbps audio
      "-movflags",
      "+faststart", // Optimize for web streaming
      "-pix_fmt",
      "yuv420p", // Compatible pixel format
      "-y", // Overwrite output
      outputName,
    ]);

    // Read output file
    const data = await this.ffmpeg.readFile(outputName);

    // Clean up virtual filesystem
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Create MP4 blob
    const mp4Blob = new Blob([data.buffer], { type: "video/mp4" });

    console.log(
      `✅ Converted to MP4: ${(mp4Blob.size / 1024 / 1024).toFixed(2)} MB`,
    );

    return mp4Blob;
  }
}

// Create global instance
const videoConverter = new VideoConverter();
