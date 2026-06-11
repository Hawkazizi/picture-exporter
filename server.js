const express = require("express");
const path = require("path");
const multer = require("multer");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.render("index", { title: "Image Text Editor" });
});

// =========================================
// VIDEO GENERATION ROUTE
// =========================================
app.post(
  "/api/generate-video",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files["video"] || !req.files["audio"]) {
        return res
          .status(400)
          .json({ error: "Video and audio files are required" });
      }

      // Get user-specified duration (default to 5 seconds if missing)
      const duration = parseFloat(req.body.duration) || 5;

      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const tempVideo = path.join(tempDir, `vid_${Date.now()}.webm`);
      const tempAudio = path.join(tempDir, `aud_${Date.now()}.mp3`);
      const tempOutput = path.join(tempDir, `out_${Date.now()}.mp4`);

      fs.writeFileSync(tempVideo, req.files["video"][0].buffer);
      fs.writeFileSync(tempAudio, req.files["audio"][0].buffer);

      // FFmpeg: Merge video and audio, trim to exact duration, optimize for mobile
      const args = [
        "-i",
        tempVideo,
        "-i",
        tempAudio,
        "-c:v",
        "libx264", // Re-encode to H.264 for max compatibility
        "-pix_fmt",
        "yuv420p", // Crucial for browser/phone players
        "-c:a",
        "aac", // Encode audio to AAC
        "-t",
        duration.toString(), // Trim to user-specified duration
        "-movflags",
        "+faststart", // CRITICAL: Moves metadata to front for mobile playback/downloading
        tempOutput,
      ];

      execFile(ffmpegPath, args, (error, stdout, stderr) => {
        // Clean up temp input files
        [tempVideo, tempAudio].forEach((file) => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        });

        if (error) {
          console.error("FFmpeg error:", stderr);
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          return res.status(500).json({ error: "Video generation failed" });
        }

        // Send the file back to the browser
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="quote-video.mp4"',
        );

        const fileStream = fs.createReadStream(tempOutput);
        fileStream.pipe(res);

        // Clean up output file after sending
        fileStream.on("end", () => {
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        });
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
