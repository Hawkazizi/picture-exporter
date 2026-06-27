// public/js/BatchVideoManager.js

class BatchVideoManager {
  constructor(editor) {
    this.editor = editor;
    this.isProcessing = false;
  }

  sanitizeFilename(text, index) {
    let sanitized = text
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w\u0600-\u06FF\-]/g, "_")
      .substring(0, 60)
      .replace(/^_+|_+$/g, "");

    if (!sanitized || sanitized.length === 0) {
      sanitized = `video_${index + 1}`;
    }

    return `${sanitized}_${index + 1}`;
  }

  async startGeneration(mp3Files, globalEffect, duration, progressCallback) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const allGenerated = [];
    this.editor.generatedByImage.forEach((items, imgIndex) => {
      if (items && items.length > 0) {
        items.forEach((item, genIndex) => {
          allGenerated.push({ item, imgIndex, genIndex });
        });
      }
    });

    if (allGenerated.length === 0) {
      alert("هیچ تصویری برای تولید ویدیو یافت نشد!");
      this.isProcessing = false;
      return;
    }
    if (mp3Files.length === 0) {
      alert("لطفاً حداقل یک فایل MP3 آپلود کنید!");
      this.isProcessing = false;
      return;
    }

    const zip = new JSZip();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();

    try {
      for (let i = 0; i < allGenerated.length; i++) {
        const { item, imgIndex, genIndex } = allGenerated[i];
        const fileName = this.sanitizeFilename(item.text, i);

        if (progressCallback) {
          progressCallback(
            i,
            allGenerated.length,
            `Recording video ${i + 1} of ${allGenerated.length}...`,
          );
        }

        const mp3File = mp3Files[i % mp3Files.length];
        this.editor.startEditingGenerated(imgIndex, genIndex, true);
        await new Promise((resolve) => setTimeout(resolve, 150));

        // 🔥 Record directly (MP4 or WebM depending on browser)
        const recorder = new VideoRecorder(
          this.editor,
          mp3File,
          globalEffect,
          duration,
          audioContext,
        );

        const { blob, ext } = await recorder.record();

        // Add to ZIP with correct extension
        zip.file(`${fileName}.${ext}`, blob);
      }

      if (progressCallback) {
        progressCallback(
          allGenerated.length,
          allGenerated.length,
          "Creating ZIP file...",
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `batch_videos_${Date.now()}.zip`);
    } catch (error) {
      console.error("Batch generation failed:", error);
      alert("خطا در ساخت گروهی ویدیوها: " + error.message);
    } finally {
      await audioContext.close();
      this.isProcessing = false;

      if (progressCallback) {
        progressCallback(-1, -1, "");
      }

      this.editor.draw();
    }
  }
}
