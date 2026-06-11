class ImageEditor {
  constructor() {
    this.canvas = document.getElementById("editorCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.placeholder = document.getElementById("placeholderText");

    this.image = new Image();
    this.isImageLoaded = false;
    this.text = "";
    this.textX = 50;
    this.textY = 100;
    this.fontSize = 40;
    this.fontFamily = "BYekan";
    this.textColor = "#ffffff";
    this.imageStyle = "none";
    this.generatedImages = [];

    this.currentlyEditingIndex = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.videoDuration = 5000;
    this.previewAnimationId = null; // For live effect preview

    this.initElements();
    this.bindEvents();

    this.resetToDefaults();

    document.fonts.ready.then(() => {
      this.draw();
    });
  }

  resetToDefaults() {
    this.image = new Image();
    this.isImageLoaded = false;
    this.text = "";
    this.textX = 50;
    this.textY = 100;
    this.fontSize = 40;
    this.fontFamily = "BYekan";
    this.textColor = "#ffffff";
    this.imageStyle = "none";
    this.generatedImages = [];
    this.currentlyEditingIndex = null;
    this.isDragging = false;
    this.videoDuration = 5000;

    if (this.textInput) this.textInput.value = "";
    if (this.fontFamilySelect) this.fontFamilySelect.value = "BYekan";
    if (this.fontSizeInput) {
      this.fontSizeInput.value = 40;
      if (this.fontSizeValue) this.fontSizeValue.textContent = 40;
    }
    if (this.textColorInput) {
      this.textColorInput.value = "#ffffff";
      if (this.colorHex) this.colorHex.textContent = "#ffffff";
    }
    if (this.imageStyleSelect) this.imageStyleSelect.value = "none";
    if (this.batchTexts) this.batchTexts.value = "";
    if (this.imageUpload) this.imageUpload.value = "";
    if (this.audioUpload) this.audioUpload.value = "";
    if (this.videoDurationInput) this.videoDurationInput.value = 5;

    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }

    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.placeholder) this.placeholder.style.display = "block";

    if (this.editMode) this.editMode.classList.remove("hidden");
    if (this.batchMode) this.batchMode.classList.add("hidden");
    if (this.editVideoControls) this.editVideoControls.classList.add("hidden");

    const indicator = document.querySelector(".edit-mode-indicator");
    if (indicator) indicator.remove();
  }

  initElements() {
    this.imageUpload = document.getElementById("imageUpload");
    this.textInput = document.getElementById("textInput");
    this.fontFamilySelect = document.getElementById("fontFamily");
    this.fontSizeInput = document.getElementById("fontSize");
    this.fontSizeValue = document.getElementById("fontSizeValue");
    this.textColorInput = document.getElementById("textColor");
    this.colorHex = document.getElementById("colorHex");
    this.downloadBtn = document.getElementById("downloadBtn");

    this.imageStyleSelect = document.getElementById("imageStyle");

    this.audioUpload = document.getElementById("audioUploadEdit");
    this.videoDurationInput = document.getElementById("videoDuration");
    this.generateVideoBtn = document.getElementById("generateVideoBtnEdit");
    this.editVideoControls = document.getElementById("editVideoControls");
    this.videoEffectSelect = document.getElementById("videoEffect");

    this.batchTexts = document.getElementById("batchTexts");
    this.generateBtn = document.getElementById("generateBtn");
    this.editMode = document.getElementById("editMode");
    this.batchMode = document.getElementById("batchMode");
    this.batchGrid = document.getElementById("batchGrid");
    this.downloadAllBtn = document.getElementById("downloadAllBtn");
    this.backToEditorBtn = document.getElementById("backToEditorBtn");
  }

  bindEvents() {
    this.imageUpload.addEventListener("change", (e) =>
      this.handleImageUpload(e),
    );

    this.textInput.addEventListener("input", (e) => {
      this.text = e.target.value;
      this.draw();
      if (this.currentlyEditingIndex !== null) this.updateBatchImageState();
    });

    this.fontFamilySelect.addEventListener("change", async (e) => {
      this.fontFamily = e.target.value;
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (err) {}
      this.draw();
      if (this.currentlyEditingIndex !== null) this.updateBatchImageState();
    });

    this.fontSizeInput.addEventListener("input", async (e) => {
      this.fontSize = parseInt(e.target.value, 10);
      this.fontSizeValue.textContent = this.fontSize;
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (err) {}
      this.draw();
      if (this.currentlyEditingIndex !== null) this.updateBatchImageState();
    });

    this.textColorInput.addEventListener("input", (e) => {
      this.textColor = e.target.value;
      this.colorHex.textContent = this.textColor;
      this.draw();
      if (this.currentlyEditingIndex !== null) this.updateBatchImageState();
    });

    this.imageStyleSelect.addEventListener("change", (e) => {
      this.imageStyle = e.target.value;
      this.draw();
      if (this.currentlyEditingIndex !== null) this.updateBatchImageState();
    });

    // NEW: Live preview when effect changes
    this.videoEffectSelect.addEventListener("change", (e) => {
      this.startEffectPreview(e.target.value);
    });

    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
    this.canvas.addEventListener("mouseleave", () => this.handleMouseUp());
    this.canvas.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: false },
    );
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", () => this.handleMouseUp());

    this.downloadBtn.addEventListener("click", () => this.downloadImage());
    this.generateBtn.addEventListener("click", () => this.generateBatch());
    this.backToEditorBtn.addEventListener("click", () => this.showBatchMode());
    this.downloadAllBtn.addEventListener("click", () => this.downloadAllZip());
    this.generateVideoBtn.addEventListener("click", () => this.generateVideo());
  }

  // NEW: Starts a continuous 5-second looping preview of the selected effect
  startEffectPreview(effect) {
    if (this.previewAnimationId) cancelAnimationFrame(this.previewAnimationId);
    if (!this.isImageLoaded || effect === "none") {
      this.draw();
      return;
    }

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: Math.random() * 5 + 1,
      speed: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.1,
    }));

    let startTime = null;
    const previewDuration = 5000; // 5 seconds loop

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      let progress = (timestamp - startTime) / previewDuration;

      if (progress >= 1) {
        startTime = timestamp; // Loop the preview
        progress = 0;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;

      this.applyEffect(effect, progress, timestamp, particles);

      this.ctx.filter = "none";
      this.drawText();

      this.previewAnimationId = requestAnimationFrame(animate);
    };
    this.previewAnimationId = requestAnimationFrame(animate);
  }

  // NEW: Extracted effect logic so both Preview and Video Generator can use it
  applyEffect(effect, progress, timestamp, particles) {
    if (effect === "kenburns") {
      const scale = 1 + progress * 0.2;
      this.ctx.drawImage(
        this.image,
        (this.canvas.width - this.canvas.width * scale) / 2,
        (this.canvas.height - this.canvas.height * scale) / 2,
        this.canvas.width * scale,
        this.canvas.height * scale,
      );
    } else if (effect === "zoomout") {
      const scale = 1.25 - progress * 0.25;
      this.ctx.drawImage(
        this.image,
        (this.canvas.width - this.canvas.width * scale) / 2,
        (this.canvas.height - this.canvas.height * scale) / 2,
        this.canvas.width * scale,
        this.canvas.height * scale,
      );
    } else if (effect === "pan") {
      const scale = 1.2;
      const w = this.canvas.width * scale;
      const h = this.canvas.height * scale;
      this.ctx.drawImage(
        this.image,
        (this.canvas.width - w) * progress,
        (this.canvas.height - h) / 2,
        w,
        h,
      );
    } else if (effect === "wavy") {
      const slices = 60;
      const sliceHeight = Math.ceil(this.canvas.height / slices);
      for (let i = 0; i < slices; i++) {
        const y = i * sliceHeight;
        const h = Math.min(sliceHeight, this.canvas.height - y);
        if (h <= 0) continue;
        this.ctx.drawImage(
          this.image,
          0,
          y,
          this.canvas.width,
          h,
          Math.sin(y * 0.015 + timestamp * 0.004) * 25,
          y,
          this.canvas.width,
          h,
        );
      }
    } else if (effect === "shake") {
      this.ctx.drawImage(
        this.image,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        this.canvas.width,
        this.canvas.height,
      );
    } else if (effect === "pulse") {
      const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
      this.ctx.drawImage(
        this.image,
        (this.canvas.width - this.canvas.width * scale) / 2,
        (this.canvas.height - this.canvas.height * scale) / 2,
        this.canvas.width * scale,
        this.canvas.height * scale,
      );
    } else if (effect === "rotate") {
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.rotate(progress * Math.PI * 0.5);
      this.ctx.drawImage(
        this.image,
        -this.canvas.width / 2,
        -this.canvas.height / 2,
        this.canvas.width,
        this.canvas.height,
      );
      this.ctx.restore();
    } else if (effect === "glitch") {
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      if (Math.random() > 0.6) {
        const sliceY = Math.random() * this.canvas.height;
        const sliceH = Math.random() * 40 + 10;
        const shift = (Math.random() - 0.5) * 30;
        this.ctx.drawImage(
          this.image,
          0,
          sliceY,
          this.canvas.width,
          sliceH,
          shift,
          sliceY,
          this.canvas.width,
          sliceH,
        );
      }
    } else if (effect === "vhs") {
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      for (let i = 0; i < this.canvas.height; i += 4) {
        this.ctx.fillRect(0, i, this.canvas.width, 2);
      }
    } else if (effect === "hue") {
      const baseFilter = this.imageStyle !== "none" ? this.imageStyle : "";
      this.ctx.filter = `hue-rotate(${progress * 360}deg) ${baseFilter}`.trim();
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    } else if (effect === "blur") {
      const blurAmount = Math.abs(Math.sin(progress * Math.PI * 4)) * 8;
      const baseFilter = this.imageStyle !== "none" ? this.imageStyle : "";
      this.ctx.filter = `blur(${blurAmount}px) ${baseFilter}`.trim();
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    } else if (effect === "fade") {
      const alpha = Math.abs(Math.sin(progress * Math.PI * 2));
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      this.ctx.globalAlpha = 1.0;
    } else if (effect === "zoompulse") {
      const scale = 1 + Math.abs(Math.sin(progress * Math.PI * 8)) * 0.2;
      this.ctx.drawImage(
        this.image,
        (this.canvas.width - this.canvas.width * scale) / 2,
        (this.canvas.height - this.canvas.height * scale) / 2,
        this.canvas.width * scale,
        this.canvas.height * scale,
      );
    } else if (effect === "slideleft") {
      const offset = (1 - progress) * this.canvas.width;
      this.ctx.drawImage(
        this.image,
        offset,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    } else if (effect === "slideup") {
      const offset = (1 - progress) * this.canvas.height;
      this.ctx.drawImage(
        this.image,
        0,
        offset,
        this.canvas.width,
        this.canvas.height,
      );
    } else if (effect === "flash") {
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      const flashIntensity = Math.abs(Math.sin(progress * Math.PI * 6));
      this.ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.6})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (effect === "invert_pulse") {
      const isInverted = Math.sin(progress * Math.PI * 8) > 0;
      const baseFilter = this.imageStyle !== "none" ? this.imageStyle : "";
      this.ctx.filter =
        `${isInverted ? "invert(100%)" : ""} ${baseFilter}`.trim() || "none";
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    } else if (effect === "flip") {
      const scaleX = Math.cos(progress * Math.PI * 4);
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.scale(scaleX, 1);
      this.ctx.drawImage(
        this.image,
        -this.canvas.width / 2,
        -this.canvas.height / 2,
        this.canvas.width,
        this.canvas.height,
      );
      this.ctx.restore();
    } else {
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    }

    if (effect === "particles") {
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(timestamp / 1000 + p.y * 0.01) * 0.8;
        if (p.y < -10) {
          p.y = this.canvas.height + 10;
          p.x = Math.random() * this.canvas.width;
        }
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.fill();
      });
    }
  }

  updateBatchImageState() {
    if (this.currentlyEditingIndex !== null) {
      const img = this.generatedImages[this.currentlyEditingIndex];
      img.text = this.text;
      img.textX = this.textX;
      img.textY = this.textY;
      img.fontSize = this.fontSize;
      img.fontFamily = this.fontFamily;
      img.textColor = this.textColor;
      img.imageStyle = this.imageStyle;
    }
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      this.image = new Image();
      this.image.onload = async () => {
        this.isImageLoaded = true;
        this.placeholder.style.display = "none";
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        const smartFontSize = Math.round(this.canvas.width * 0.05);
        this.fontSize = smartFontSize;
        this.fontSizeInput.value = this.fontSize;
        this.fontSizeValue.textContent = this.fontSize;
        this.textX = this.canvas.width / 2;
        this.textY = this.canvas.height / 2;

        try {
          await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
        } catch (e) {}

        this.draw();
        this.editVideoControls.classList.remove("hidden");
      };
      this.image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  draw() {
    if (!this.isImageLoaded) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = "none";

    this.drawText();
  }

  drawText() {
    if (!this.text) return;
    this.ctx.font = `${this.fontSize}px "${this.fontFamily}"`;
    this.ctx.fillStyle = this.textColor;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText(this.text, this.textX, this.textY);
    this.ctx.shadowColor = "transparent";
  }

  getMousePos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  isMouseOverText(mouseX, mouseY) {
    if (!this.text) return false;
    this.ctx.font = `${this.fontSize}px "${this.fontFamily}"`;
    const metrics = this.ctx.measureText(this.text);
    const textWidth = metrics.width;
    const textHeight = this.fontSize;
    const padding = 10;
    return (
      mouseX >= this.textX - textWidth / 2 - padding &&
      mouseX <= this.textX + textWidth / 2 + padding &&
      mouseY >= this.textY - textHeight / 2 - padding &&
      mouseY <= this.textY + textHeight / 2 + padding
    );
  }

  handleMouseDown(e) {
    if (!this.isImageLoaded) return;
    const pos = this.getMousePos(e);
    if (this.isMouseOverText(pos.x, pos.y)) {
      this.isDragging = true;
      this.dragStartX = pos.x - this.textX;
      this.dragStartY = pos.y - this.textY;
      this.canvas.style.cursor = "grabbing";
    }
  }

  handleMouseMove(e) {
    if (!this.isImageLoaded) return;
    const pos = this.getMousePos(e);
    if (this.isDragging) {
      this.textX = pos.x - this.dragStartX;
      this.textY = pos.y - this.dragStartY;
      this.draw();
      if (this.currentlyEditingIndex !== null) this.updateBatchImageState();
    } else {
      this.canvas.style.cursor = this.isMouseOverText(pos.x, pos.y)
        ? "grab"
        : "crosshair";
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = "crosshair";
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.canvas.dispatchEvent(
      new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      }),
    );
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.canvas.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      }),
    );
  }

  downloadImage() {
    if (!this.isImageLoaded)
      return alert("لطفاً ابتدا یک تصویر بارگذاری کنید!");
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = this.canvas.toDataURL("image/png");
    link.click();
  }

  async generateVideo() {
    if (!this.isImageLoaded)
      return alert("لطفاً ابتدا یک تصویر بارگذاری کنید!");
    const audioFile = this.audioUpload.files[0];
    if (!audioFile) return alert("لطفاً ابتدا یک فایل صوتی (MP3) انتخاب کنید!");

    // Stop live preview before recording
    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }

    const originalBtnText = this.generateVideoBtn.innerText;
    this.generateVideoBtn.innerText = "در حال آماده‌سازی...";
    this.generateVideoBtn.disabled = true;

    try {
      // Get user-specified duration
      const durationSec = parseFloat(this.videoDurationInput.value) || 5;
      this.videoDuration = durationSec * 1000;

      this.generateVideoBtn.innerText = `در حال ضبط ویدیو (${durationSec} ثانیه)...`;
      const effect = this.videoEffectSelect.value;
      const stream = this.canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
        ? "video/webm; codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        this.generateVideoBtn.innerText = "در حال پردازش نهایی و دانلود...";
        const videoBlob = new Blob(chunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", videoBlob, "animation.webm");
        formData.append("audio", audioFile);
        formData.append("duration", durationSec); // Send duration to server

        try {
          const response = await fetch("/api/generate-video", {
            method: "POST",
            body: formData,
          });
          if (!response.ok)
            throw new Error((await response.json()).error || "Server error");

          const blob = await response.blob();
          const filename =
            this.currentlyEditingIndex !== null
              ? `video_quote_${this.currentlyEditingIndex + 1}.mp4`
              : "quote-video.mp4";

          // Use FileSaver.js for 100% cross-device download compatibility
          saveAs(blob, filename);

          alert("✅ ویدیو با موفقیت ساخته و دانلود شد!");
        } catch (error) {
          console.error(error);
          alert("خطا در ساخت ویدیو: " + error.message);
        } finally {
          this.draw();
          this.generateVideoBtn.innerText = originalBtnText;
          this.generateVideoBtn.disabled = false;
        }
      };

      recorder.start();
      let startTime = null;
      const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 5 + 1,
        speed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
      }));

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / this.videoDuration;
        if (progress >= 1) {
          recorder.stop();
          return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;

        // Use the extracted effect logic
        this.applyEffect(effect, progress, timestamp, particles);

        this.ctx.filter = "none";
        this.drawText();

        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    } catch (error) {
      console.error(error);
      alert("خطا در خواندن فایل صوتی یا ساخت ویدیو: " + error.message);
      this.draw();
      this.generateVideoBtn.innerText = originalBtnText;
      this.generateVideoBtn.disabled = false;
    }
  }

  generateBatch() {
    if (!this.isImageLoaded)
      return alert("لطفاً ابتدا یک تصویر بارگذاری کنید!");
    const texts = this.batchTexts.value
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t !== "");
    if (texts.length === 0) return alert("لطفاً حداقل یک متن وارد کنید!");

    this.batchGrid.innerHTML = "";
    this.generatedImages = [];
    this.currentlyEditingIndex = null;

    const originalText = this.text,
      originalX = this.textX,
      originalY = this.textY;
    const originalFontSize = this.fontSize,
      originalFontFamily = this.fontFamily,
      originalColor = this.textColor;
    const originalImageStyle = this.imageStyle;

    texts.forEach((currentText, index) => {
      this.text = currentText;
      this.draw();
      const dataUrl = this.canvas.toDataURL("image/png");
      this.generatedImages.push({
        text: currentText,
        textX: this.textX,
        textY: this.textY,
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        textColor: this.textColor,
        imageStyle: this.imageStyle,
        dataUrl,
      });

      const item = document.createElement("div");
      item.className = "batch-item";
      const displayText =
        currentText.length > 30
          ? currentText.substring(0, 30) + "..."
          : currentText;
      item.innerHTML = `
        <img src="${dataUrl}" alt="Generated ${index + 1}">
        <div class="batch-item-content">
          <div class="batch-item-text">${displayText}</div>
          <div class="batch-item-actions">
            <button class="edit-btn" data-index="${index}">ویرایش</button>
            <button class="download-btn" data-index="${index}">دانلود</button>
          </div>
        </div>`;

      item.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        this.editBatchImage(parseInt(e.target.getAttribute("data-index")));
      });
      item.querySelector(".download-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(e.target.getAttribute("data-index"));
        const link = document.createElement("a");
        link.download = `image_${idx + 1}.png`;
        link.href = this.generatedImages[idx].dataUrl;
        link.click();
      });
      item.addEventListener("click", () => this.editBatchImage(index));
      this.batchGrid.appendChild(item);
    });

    this.text = originalText;
    this.textX = originalX;
    this.textY = originalY;
    this.fontSize = originalFontSize;
    this.fontFamily = originalFontFamily;
    this.textColor = originalColor;
    this.imageStyle = originalImageStyle;
    this.draw();
    this.editMode.classList.add("hidden");
    this.batchMode.classList.remove("hidden");
  }

  editBatchImage(index) {
    const imgData = this.generatedImages[index];
    if (!imgData) return;
    this.text = imgData.text;
    this.textX = imgData.textX;
    this.textY = imgData.textY;
    this.fontSize = imgData.fontSize;
    this.fontFamily = imgData.fontFamily;
    this.textColor = imgData.textColor;

    this.imageStyle = imgData.imageStyle || "none";
    this.imageStyleSelect.value = this.imageStyle;

    this.textInput.value = this.text;
    this.fontFamilySelect.value = this.fontFamily;
    this.fontSizeInput.value = this.fontSize;
    this.fontSizeValue.textContent = this.fontSize;
    this.textColorInput.value = this.textColor;
    this.colorHex.textContent = this.textColor;
    this.currentlyEditingIndex = index;
    this.draw();
    this.batchMode.classList.add("hidden");
    this.editMode.classList.remove("hidden");
    this.editVideoControls.classList.remove("hidden");
    this.audioUpload.value = "";

    let indicator = document.querySelector(".edit-mode-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "edit-mode-indicator";
      this.editMode.insertBefore(indicator, this.editMode.firstChild);
    }
    const displayText =
      this.text.length > 40 ? this.text.substring(0, 40) + "..." : this.text;
    indicator.innerHTML = `<span>در حال ویرایش: "${displayText}"</span><button id="backToBatchBtn">بازگشت →</button>`;
    document
      .getElementById("backToBatchBtn")
      .addEventListener("click", () => this.showBatchMode());
  }

  showBatchMode() {
    this.currentlyEditingIndex = null;
    this.editVideoControls.classList.add("hidden");
    this.audioUpload.value = "";
    const indicator = document.querySelector(".edit-mode-indicator");
    if (indicator) indicator.remove();

    this.batchGrid.innerHTML = "";
    this.generatedImages.forEach((imgData, index) => {
      this.text = imgData.text;
      this.textX = imgData.textX;
      this.textY = imgData.textY;
      this.fontSize = imgData.fontSize;
      this.fontFamily = imgData.fontFamily;
      this.textColor = imgData.textColor;
      this.imageStyle = imgData.imageStyle || "none";

      this.draw();
      imgData.dataUrl = this.canvas.toDataURL("image/png");

      const item = document.createElement("div");
      item.className = "batch-item";
      const displayText =
        imgData.text.length > 30
          ? imgData.text.substring(0, 30) + "..."
          : imgData.text;
      item.innerHTML = `
        <img src="${imgData.dataUrl}" alt="Generated ${index + 1}">
        <div class="batch-item-content">
          <div class="batch-item-text">${displayText}</div>
          <div class="batch-item-actions">
            <button class="edit-btn" data-index="${index}">ویرایش</button>
            <button class="download-btn" data-index="${index}">دانلود</button>
          </div>
        </div>`;

      item.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        this.editBatchImage(parseInt(e.target.getAttribute("data-index")));
      });
      item.querySelector(".download-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(e.target.getAttribute("data-index"));
        const link = document.createElement("a");
        link.download = `image_${idx + 1}.png`;
        link.href = this.generatedImages[idx].dataUrl;
        link.click();
      });
      item.addEventListener("click", () => this.editBatchImage(index));
      this.batchGrid.appendChild(item);
    });
    this.batchMode.classList.remove("hidden");
    this.editMode.classList.add("hidden");
  }

  async downloadAllZip() {
    if (!this.generatedImages || this.generatedImages.length === 0) return;
    this.downloadAllBtn.innerText = "در حال آماده‌سازی...";
    this.downloadAllBtn.disabled = true;
    const zip = new JSZip();
    this.generatedImages.forEach((img, index) => {
      zip.file(`image_${index + 1}.png`, img.dataUrl.split(",")[1], {
        base64: true,
      });
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "batch-images.zip");
    this.downloadAllBtn.innerText = "⬇ دانلود همه (ZIP)";
    this.downloadAllBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ImageEditor();
});
