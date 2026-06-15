class ImageEditor {
  constructor() {
    this.canvas = document.getElementById("editorCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.placeholder = document.getElementById("placeholderText");

    this.images = [];
    this.activeImageIndex = -1;
    this.generatedByImage = []; // Array of arrays to hold generations per image

    this.image = new Image();
    this.isImageLoaded = false;
    this.text = "";
    this.textX = 50;
    this.textY = 100;
    this.fontSize = 40;
    this.fontFamily = "BYekan";
    this.textColor = "#ffffff";
    this.imageStyle = "none";

    this.textBoxWidthPercent = 80;
    this.textBoxHeightPercent = 40;

    this.currentlyEditingGenerated = null; // Tracks { imgIndex, genIndex }
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.videoDuration = 5000;
    this.previewAnimationId = null;

    this.initElements();
    this.bindEvents();
    this.resetToDefaults();

    document.fonts.ready.then(() => {
      this.draw();
    });
  }

  resetToDefaults() {
    this.images = [];
    this.activeImageIndex = -1;
    this.generatedByImage = [];
    this.currentlyEditingGenerated = null;

    this.image = new Image();
    this.isImageLoaded = false;
    this.text = "";
    this.textX = 50;
    this.textY = 100;
    this.fontSize = 40;
    this.fontFamily = "BYekan";
    this.textColor = "#ffffff";
    this.imageStyle = "none";
    this.isDragging = false;
    this.videoDuration = 5000;
    this.textBoxWidthPercent = 80;
    this.textBoxHeightPercent = 40;

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

    if (this.imageTextsContainer) {
      this.imageTextsContainer.innerHTML =
        '<p class="hint">ابتدا تصاویر را بارگذاری کنید...</p>';
    }
    if (this.imageSelector) {
      this.imageSelector.innerHTML =
        '<p class="hint">ابتدا تصاویر را بارگذاری کنید...</p>';
    }
    if (this.categorizedPreviews) {
      this.categorizedPreviews.innerHTML = "";
    }

    if (this.imageUpload) this.imageUpload.value = "";
    if (this.audioUpload) this.audioUpload.value = "";
    if (this.videoDurationInput) this.videoDurationInput.value = 5;

    if (this.textBoxWidthInput) {
      this.textBoxWidthInput.value = 80;
      if (this.textBoxWidthValue) this.textBoxWidthValue.textContent = 80;
    }
    if (this.textBoxHeightInput) {
      this.textBoxHeightInput.value = 40;
      if (this.textBoxHeightValue) this.textBoxHeightValue.textContent = 40;
    }

    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }

    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.placeholder) this.placeholder.style.display = "block";
    if (this.editVideoControls) this.editVideoControls.classList.add("hidden");
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

    this.textBoxWidthInput = document.getElementById("textBoxWidth");
    this.textBoxWidthValue = document.getElementById("textBoxWidthValue");
    this.textBoxHeightInput = document.getElementById("textBoxHeight");
    this.textBoxHeightValue = document.getElementById("textBoxHeightValue");

    this.imageTextsContainer = document.getElementById("imageTextsContainer");
    this.imageSelector = document.getElementById("imageSelector");
    this.categorizedPreviews = document.getElementById("categorizedPreviews");
  }

  bindEvents() {
    this.imageUpload.addEventListener("change", (e) =>
      this.handleImageUpload(e),
    );

    this.textInput.addEventListener("input", (e) => {
      this.text = e.target.value;
      this.draw();
      this.updateEditingState();
    });

    this.fontFamilySelect.addEventListener("change", async (e) => {
      this.fontFamily = e.target.value;
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (err) {}
      this.draw();
      this.updateEditingState();
    });

    this.fontSizeInput.addEventListener("input", async (e) => {
      this.fontSize = parseInt(e.target.value, 10);
      this.fontSizeValue.textContent = this.fontSize;
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (err) {}
      this.draw();
      this.updateEditingState();
    });

    this.textColorInput.addEventListener("input", (e) => {
      this.textColor = e.target.value;
      this.colorHex.textContent = this.textColor;
      this.draw();
      this.updateEditingState();
    });

    this.imageStyleSelect.addEventListener("change", (e) => {
      this.imageStyle = e.target.value;
      this.draw();
      this.updateEditingState();
    });

    this.textBoxWidthInput.addEventListener("input", (e) => {
      this.textBoxWidthPercent = parseInt(e.target.value, 10);
      this.textBoxWidthValue.textContent = this.textBoxWidthPercent;
      this.draw();
      this.updateEditingState();
    });

    this.textBoxHeightInput.addEventListener("input", (e) => {
      this.textBoxHeightPercent = parseInt(e.target.value, 10);
      this.textBoxHeightValue.textContent = this.textBoxHeightPercent;
      this.draw();
      this.updateEditingState();
    });

    this.videoEffectSelect.addEventListener("change", (e) =>
      this.startEffectPreview(e.target.value),
    );

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
    this.generateVideoBtn.addEventListener("click", () => this.generateVideo());
  }

  // ==========================================
  // IMAGE UPLOAD & INITIALIZATION
  // ==========================================
  handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const tempImages = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          tempImages[index] = img;
          loadedCount++;
          if (loadedCount === files.length)
            this.processLoadedImages(tempImages);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  processLoadedImages(tempImages) {
    this.images = [];
    const baseWidth = tempImages[0].width;
    const baseHeight = tempImages[0].height;
    let processedCount = 0;
    const total = tempImages.length;

    tempImages.forEach((img, index) => {
      if (img.width === baseWidth && img.height === baseHeight) {
        this.images[index] = img;
        processedCount++;
        if (processedCount === total) this.finalizeImageLoad();
      } else {
        const offscreen = document.createElement("canvas");
        offscreen.width = baseWidth;
        offscreen.height = baseHeight;
        const offCtx = offscreen.getContext("2d");
        offCtx.drawImage(img, 0, 0, baseWidth, baseHeight);

        const resizedImg = new Image();
        resizedImg.onload = () => {
          this.images[index] = resizedImg;
          processedCount++;
          if (processedCount === total) this.finalizeImageLoad();
        };
        resizedImg.src = offscreen.toDataURL();
      }
    });
  }

  finalizeImageLoad() {
    this.activeImageIndex = 0;
    this.generatedByImage = this.images.map(() => []);

    this.image = this.images[0];
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

    (async () => {
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (e) {}
      this.draw();
    })();

    this.renderImageSelector();
    this.renderSidebarTextareas();
    this.renderCategorizedSections();
    this.setActiveImage(0);

    this.editVideoControls.classList.remove("hidden");
  }

  // ==========================================
  // UI RENDERING
  // ==========================================
  renderImageSelector() {
    const container = this.imageSelector;
    container.innerHTML = "";
    this.images.forEach((img, i) => {
      const thumb = document.createElement("div");
      thumb.className =
        "image-thumb" + (i === this.activeImageIndex ? " active" : "");
      thumb.innerHTML = `<img src="${img.src}" alt="Image ${i + 1}"><span>تصویر ${i + 1}</span>`;
      thumb.onclick = () => this.setActiveImage(i);
      container.appendChild(thumb);
    });
  }

  setActiveImage(index) {
    this.activeImageIndex = index;
    this.image = this.images[index];
    this.isImageLoaded = true;
    this.placeholder.style.display = "none";
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;

    document.querySelectorAll(".image-thumb").forEach((el, i) => {
      el.classList.toggle("active", i === index);
    });

    this.draw();
  }

  renderSidebarTextareas() {
    if (!this.imageTextsContainer) return;
    this.imageTextsContainer.innerHTML = "";

    this.images.forEach((img, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "image-text-item";

      const thumbnail = document.createElement("img");
      thumbnail.src = img.src;

      const label = document.createElement("label");
      label.textContent = `متن‌های تصویر ${index + 1} (هر خط یک خروجی):`;

      const textarea = document.createElement("textarea");
      textarea.id = `textForImage_${index}`;
      textarea.rows = 3;
      textarea.placeholder = `متن ۱ برای تصویر ${index + 1}\nمتن ۲ برای تصویر ${index + 1}...`;
      textarea.addEventListener("input", () =>
        this.updateCategoryTextsPreviews(),
      );

      itemDiv.appendChild(thumbnail);
      itemDiv.appendChild(label);
      itemDiv.appendChild(textarea);
      this.imageTextsContainer.appendChild(itemDiv);
    });
  }

  renderCategorizedSections() {
    const container = this.categorizedPreviews;
    container.innerHTML = "";

    this.images.forEach((img, i) => {
      const section = document.createElement("div");
      section.className = "category-section";
      section.id = `category-${i}`;

      section.innerHTML = `
              <div class="category-header">
                  <img src="${img.src}" class="category-thumb" alt="Image ${i + 1}">
                  <div class="category-info">
                      <h3>تصویر ${i + 1}</h3>
                      <p class="category-texts-preview">هنوز متنی وارد نشده است.</p>
                  </div>
                  <div class="category-actions">
                      <button class="primary-btn generate-cat-btn" data-index="${i}">✨ تولید پیش‌نمایش‌ها</button>
                      <button class="secondary-btn download-cat-btn hidden" data-index="${i}">⬇ دانلود این دسته (ZIP)</button>
                  </div>
              </div>
              <div class="category-grid" id="grid-${i}"></div>
          `;

      container.appendChild(section);

      section.querySelector(".generate-cat-btn").onclick = () =>
        this.generateForImage(i);
      section.querySelector(".download-cat-btn").onclick = () =>
        this.downloadCategoryZip(i);
    });

    this.updateCategoryTextsPreviews();
  }

  updateCategoryTextsPreviews() {
    this.images.forEach((img, i) => {
      const textarea = document.getElementById(`textForImage_${i}`);
      const previewEl = document.querySelector(
        `#category-${i} .category-texts-preview`,
      );
      if (textarea && previewEl) {
        const lines = textarea.value.split("\n").filter((l) => l.trim() !== "");
        previewEl.textContent =
          lines.length > 0
            ? `${lines.length} متن وارد شده است.`
            : "هنوز متنی وارد نشده است.";
      }
    });
  }

  // ==========================================
  // GENERATION & EDITING LOGIC
  // ==========================================
  generateForImage(imgIndex) {
    const textarea = document.getElementById(`textForImage_${imgIndex}`);
    if (!textarea) return;

    const texts = textarea.value
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t !== "");
    if (texts.length === 0)
      return alert("لطفاً حداقل یک متن برای این تصویر وارد کنید!");

    const originalImage = this.image;
    const originalText = this.text;

    this.image = this.images[imgIndex];
    this.generatedByImage[imgIndex] = [];

    const grid = document.getElementById(`grid-${imgIndex}`);
    grid.innerHTML = "";

    texts.forEach((currentText, genIndex) => {
      this.text = currentText;
      this.draw();
      const dataUrl = this.canvas.toDataURL("image/png");

      const itemData = {
        text: currentText,
        textX: this.textX,
        textY: this.textY,
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        textColor: this.textColor,
        imageStyle: this.imageStyle,
        textBoxWidthPercent: this.textBoxWidthPercent,
        textBoxHeightPercent: this.textBoxHeightPercent,
        dataUrl,
      };

      this.generatedByImage[imgIndex].push(itemData);

      const itemEl = document.createElement("div");
      itemEl.className = "batch-item";
      itemEl.id = `gen-${imgIndex}-${genIndex}`;
      const displayText =
        currentText.length > 40
          ? currentText.substring(0, 40) + "..."
          : currentText;

      itemEl.innerHTML = `
              <img src="${dataUrl}" alt="Generated">
              <div class="batch-item-content">
                  <div class="batch-item-text">${displayText}</div>
                  <div class="batch-item-actions">
                      <button class="edit-btn">ویرایش</button>
                      <button class="download-btn">دانلود</button>
                  </div>
              </div>
          `;

      itemEl.querySelector(".edit-btn").onclick = (e) => {
        e.stopPropagation();
        this.startEditingGenerated(imgIndex, genIndex);
      };
      itemEl.querySelector(".download-btn").onclick = (e) => {
        e.stopPropagation();
        this.downloadSingleGenerated(imgIndex, genIndex);
      };
      itemEl.onclick = () => this.startEditingGenerated(imgIndex, genIndex);

      grid.appendChild(itemEl);
    });

    document
      .querySelector(`#category-${imgIndex} .download-cat-btn`)
      .classList.remove("hidden");

    this.image = originalImage;
    this.text = originalText;
    this.draw();
  }

  startEditingGenerated(imgIndex, genIndex) {
    const itemData = this.generatedByImage[imgIndex][genIndex];
    if (!itemData) return;

    this.setActiveImage(imgIndex);

    this.text = itemData.text;
    this.textX = itemData.textX;
    this.textY = itemData.textY;
    this.fontSize = itemData.fontSize;
    this.fontFamily = itemData.fontFamily;
    this.textColor = itemData.textColor;
    this.imageStyle = itemData.imageStyle || "none";
    this.textBoxWidthPercent = itemData.textBoxWidthPercent || 80;
    this.textBoxHeightPercent = itemData.textBoxHeightPercent || 40;

    this.textInput.value = this.text;
    this.fontFamilySelect.value = this.fontFamily;
    this.fontSizeInput.value = this.fontSize;
    this.fontSizeValue.textContent = this.fontSize;
    this.textColorInput.value = this.textColor;
    this.colorHex.textContent = this.textColor;
    this.imageStyleSelect.value = this.imageStyle;
    this.textBoxWidthInput.value = this.textBoxWidthPercent;
    this.textBoxWidthValue.textContent = this.textBoxWidthPercent;
    this.textBoxHeightInput.value = this.textBoxHeightPercent;
    this.textBoxHeightValue.textContent = this.textBoxHeightPercent;

    this.currentlyEditingGenerated = { imgIndex, genIndex };

    (async () => {
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (e) {}
      this.draw();
    })();

    document
      .querySelector(".canvas-wrapper")
      .scrollIntoView({ behavior: "smooth" });
  }

  updateEditingState() {
    if (this.currentlyEditingGenerated) {
      const { imgIndex, genIndex } = this.currentlyEditingGenerated;
      const item = this.generatedByImage[imgIndex]?.[genIndex];
      if (!item) return;

      item.text = this.text;
      item.textX = this.textX;
      item.textY = this.textY;
      item.fontSize = this.fontSize;
      item.fontFamily = this.fontFamily;
      item.textColor = this.textColor;
      item.imageStyle = this.imageStyle;
      item.textBoxWidthPercent = this.textBoxWidthPercent;
      item.textBoxHeightPercent = this.textBoxHeightPercent;
      item.dataUrl = this.canvas.toDataURL("image/png");

      const itemEl = document.getElementById(`gen-${imgIndex}-${genIndex}`);
      if (itemEl) {
        itemEl.querySelector("img").src = item.dataUrl;
        itemEl.querySelector(".batch-item-text").textContent =
          this.text.length > 40
            ? this.text.substring(0, 40) + "..."
            : this.text;
      }
    }
  }

  // ==========================================
  // DOWNLOADS
  // ==========================================
  downloadImage() {
    if (!this.isImageLoaded)
      return alert("لطفاً ابتدا یک تصویر بارگذاری کنید!");
    const link = document.createElement("a");
    link.download = "canvas-image.png";
    link.href = this.canvas.toDataURL("image/png");
    link.click();
  }

  downloadSingleGenerated(imgIndex, genIndex) {
    const item = this.generatedByImage[imgIndex]?.[genIndex];
    if (!item) return;
    const link = document.createElement("a");
    link.download = `image_${imgIndex + 1}_${genIndex + 1}.png`;
    link.href = item.dataUrl;
    link.click();
  }

  async downloadCategoryZip(imgIndex) {
    const items = this.generatedByImage[imgIndex];
    if (!items || items.length === 0) return;

    const btn = document.querySelector(
      `#category-${imgIndex} .download-cat-btn`,
    );
    const originalText = btn.innerText;
    btn.innerText = "در حال آماده‌سازی...";
    btn.disabled = true;

    const zip = new JSZip();
    items.forEach((item, index) => {
      zip.file(
        `image_${imgIndex + 1}_${index + 1}.png`,
        item.dataUrl.split(",")[1],
        { base64: true },
      );
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `category_${imgIndex + 1}_images.zip`);

    btn.innerText = originalText;
    btn.disabled = false;
  }

  // ==========================================
  // CANVAS DRAWING & EFFECTS (Unchanged Logic)
  // ==========================================
  draw() {
    if (!this.isImageLoaded) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = "none";
    this.drawText();
  }

  drawText() {
    if (!this.text || !this.isImageLoaded) return;
    const maxWidth = (this.canvas.width * this.textBoxWidthPercent) / 100;
    const maxHeight = (this.canvas.height * this.textBoxHeightPercent) / 100;
    const lineHeight = this.fontSize * 1.4;
    const words = this.text.split(" ");
    const lines = [];
    let currentLine = "";
    this.ctx.font = `${this.fontSize}px "${this.fontFamily}"`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    const totalTextHeight = lines.length * lineHeight;
    let startY = this.textY - totalTextHeight / 2;
    const topBound = this.textY - maxHeight / 2;
    const bottomBound = this.textY + maxHeight / 2 - totalTextHeight;
    startY = Math.max(topBound, Math.min(startY, bottomBound));
    this.ctx.fillStyle = this.textColor;
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      if (y >= topBound && y + this.fontSize <= bottomBound + totalTextHeight) {
        this.ctx.fillText(line, this.textX, y);
      }
    });
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
    const maxWidth = (this.canvas.width * this.textBoxWidthPercent) / 100;
    const maxHeight = (this.canvas.height * this.textBoxHeightPercent) / 100;
    const padding = 10;
    return (
      mouseX >= this.textX - maxWidth / 2 - padding &&
      mouseX <= this.textX + maxWidth / 2 + padding &&
      mouseY >= this.textY - maxHeight / 2 - padding &&
      mouseY <= this.textY + maxHeight / 2 + padding
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
      this.updateEditingState();
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
    const previewDuration = 5000;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      let progress = (timestamp - startTime) / previewDuration;
      if (progress >= 1) {
        startTime = timestamp;
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

  async generateVideo() {
    if (!this.isImageLoaded)
      return alert("لطفاً ابتدا یک تصویر بارگذاری کنید!");
    const audioFile = this.audioUpload.files[0];
    if (!audioFile) return alert("لطفاً ابتدا یک فایل صوتی (MP3) انتخاب کنید!");
    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }
    const originalBtnText = this.generateVideoBtn.innerText;
    this.generateVideoBtn.innerText = "در حال آماده‌سازی...";
    this.generateVideoBtn.disabled = true;
    try {
      const durationSec = parseFloat(this.videoDurationInput.value) || 5;
      this.videoDuration = durationSec * 1000;
      this.generateVideoBtn.innerText = `در حال ضبط ویدیو (${durationSec} ثانیه)...`;
      const audioUrl = URL.createObjectURL(audioFile);
      const audioElement = new Audio(audioUrl);
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      if (audioContext.state === "suspended") await audioContext.resume();
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      const videoStream = this.canvas.captureStream(30);
      const audioTracks = destination.stream.getAudioTracks();
      audioTracks.forEach((track) => videoStream.addTrack(track));
      let mimeType = "video/webm";
      let ext = "webm";
      if (
        MediaRecorder.isTypeSupported(
          "video/mp4; codecs=avc1.42E01E, mp4a.40.2",
        )
      ) {
        mimeType = "video/mp4; codecs=avc1.42E01E, mp4a.40.2";
        ext = "mp4";
      } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9,opus")) {
        mimeType = "video/webm; codecs=vp9,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp8,opus")) {
        mimeType = "video/webm; codecs=vp8,opus";
      }
      const recorder = new MediaRecorder(videoStream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        const filename = `quote-video-${Date.now()}.${ext}`;
        const blobUrl = URL.createObjectURL(videoBlob);
        const btn = this.generateVideoBtn;
        btn.innerText = "⬇ دانلود ویدیو (کلیک کنید)";
        btn.disabled = false;
        btn.style.backgroundColor = "#2563eb";
        btn.onclick = () => {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            btn.innerText = originalBtnText;
            btn.style.backgroundColor = "";
            btn.onclick = () => this.generateVideo();
          }, 1000);
        };
        URL.revokeObjectURL(audioUrl);
        audioContext.close();
        this.draw();
      };
      recorder.start();
      audioElement.play();
      let startTime = null;
      const effect = this.videoEffectSelect.value;
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
          audioElement.pause();
          return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
        this.applyEffect(effect, progress, timestamp, particles);
        this.ctx.filter = "none";
        this.drawText();
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    } catch (error) {
      console.error(error);
      alert("خطا در ساخت ویدیو: " + error.message);
      this.draw();
      this.generateVideoBtn.innerText = originalBtnText;
      this.generateVideoBtn.disabled = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ImageEditor();
});
