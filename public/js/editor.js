class ImageEditor {
  constructor() {
    this.canvas = document.getElementById("editorCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.placeholder = document.getElementById("placeholderText");

    this.images = [];
    this.imageSrcs = [];
    this.activeImageIndex = -1;
    this.generatedByImage = [];

    this.imageTextZones = [];
    this.isDrawingZone = false;
    this.drawingZoneForIndex = -1;
    this.tempDrawRect = null;

    this.image = null;
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

    this.currentlyEditingGenerated = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.videoDuration = 5000;
    this.previewAnimationId = null;
    this.watermarkImage = null;

    this.typingDebounce = null;
    this.sliderDebounce = null;

    this.initElements();
    this.bindEvents();
    this.resetToDefaults();

    // 🔥 Preload all fonts in the background for instant switching
    const allFonts = [
      "BNazanin",
      "BSahra",
      "BYekan",
      "IranNastaliq",
      "Mandana MRT",
      "Shablon MRT",
      "Callite",
      "CANAVAR",
      "Decoration",
      "Deep Hero",
      "Diane Amorta",
      "Gemini",
      "Handwash",
      "Honey Crepes",
      "Party Script",
      "Rockers Garage",
      "Runtoe",
      "SHUTTLE-X",
      "Sunny Spells Basic",
      "The Kanzie TTF",
      "Think Smart",
      "Young Man",
    ];

    allFonts.forEach((font) => {
      document.fonts.load(`16px "${font}"`).catch(() => {});
    });

    document.fonts.ready.then(() => {
      this.draw();
    });
  }

  resetToDefaults() {
    this.images = [];
    this.imageSrcs = [];
    this.activeImageIndex = -1;
    this.generatedByImage = [];
    this.imageTextZones = [];
    this.isDrawingZone = false;
    this.drawingZoneForIndex = -1;
    this.tempDrawRect = null;
    this.currentlyEditingGenerated = null;

    this.image = null;
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
    this.watermarkImage = null;

    if (this.textInput) this.textInput.value = "";
    if (this.fontFamilySelect) this.fontFamilySelect.value = "BYekan";
    if (this.customFontOptions) {
      const defaultOpt = this.customFontOptions.querySelector(
        '.custom-font-option[data-value="BYekan"]',
      );
      if (defaultOpt) {
        this.customFontSelectedText.textContent = defaultOpt.textContent.trim();
        this.customFontSelectedText.style.fontFamily =
          defaultOpt.style.fontFamily;
        this.customFontOptions
          .querySelectorAll(".custom-font-option")
          .forEach((o) => o.classList.remove("active"));
        defaultOpt.classList.add("active");
      }
    }
    if (this.fontSizeInput) {
      this.fontSizeInput.value = 40;
      if (this.fontSizeValue) this.fontSizeValue.textContent = 40;
    }
    if (this.textColorInput) {
      this.textColorInput.value = "#ffffff";
      if (this.colorHex) this.colorHex.textContent = "#ffffff";
    }
    if (this.imageStyleSelect) this.imageStyleSelect.value = "none";

    if (this.allTextsTextarea) this.allTextsTextarea.value = "";

    if (this.imageSelector)
      this.imageSelector.innerHTML =
        '<p class="hint">ابتدا تصاویر را بارگذاری کنید...</p>';
    if (this.categorizedPreviews) this.categorizedPreviews.innerHTML = "";

    if (this.imageUpload) this.imageUpload.value = "";
    if (this.audioUpload) this.audioUpload.value = "";
    if (this.videoDurationInput) this.videoDurationInput.value = 5;
    if (this.watermarkUpload) this.watermarkUpload.value = "";

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

    if (this.canvas && this.ctx)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.placeholder) this.placeholder.style.display = "block";
    if (this.editVideoControls) this.editVideoControls.classList.add("hidden");

    if (this.generateVideoBtn) {
      this.generateVideoBtn.innerText = "🎥 ساخت و دانلود ویدیو";
      this.generateVideoBtn.disabled = false;
      this.generateVideoBtn.style.backgroundColor = "";
      this.generateVideoBtn.onclick = () => this.generateVideo();
    }
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
    this.imageSelector = document.getElementById("imageSelector");
    this.categorizedPreviews = document.getElementById("categorizedPreviews");
    this.watermarkUpload = document.getElementById("watermarkUpload");

    this.allTextsTextarea = document.getElementById("allTexts");
    this.downloadAllZipBtn = document.getElementById("downloadAllZipBtn");

    this.resetBtn = document.getElementById("resetBtn");
    this.customFontSelect = document.getElementById("fontFamilyCustom");
    if (this.customFontSelect) {
      this.customFontHeader = this.customFontSelect.querySelector(
        ".custom-font-select-header",
      );
      this.customFontOptions = this.customFontSelect.querySelector(
        ".custom-font-select-options",
      );
      this.customFontSelectedText = document.getElementById(
        "fontFamilySelectedText",
      );
    }
  }

  bindEvents() {
    this.imageUpload.addEventListener("change", (e) =>
      this.handleImageUpload(e),
    );

    this.textInput.addEventListener("input", (e) => {
      this.text = e.target.value;
      const isRTL =
        /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
          this.text,
        );
      this.textInput.dir = isRTL ? "rtl" : "ltr";
      this.draw();
      this.updateEditingState();
      clearTimeout(this.typingDebounce);
      this.typingDebounce = setTimeout(() => this.syncThumbnail(), 300);
    });

    this.fontFamilySelect.addEventListener("change", async (e) => {
      this.fontFamily = e.target.value;
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (err) {}
      this.draw();
      this.updateEditingState();
      this.syncThumbnail();
    });

    this.fontSizeInput.addEventListener("input", async (e) => {
      this.fontSize = parseInt(e.target.value, 10);
      this.fontSizeValue.textContent = this.fontSize;
      try {
        await document.fonts.load(`${this.fontSize}px "${this.fontFamily}"`);
      } catch (err) {}
      this.draw();
      this.updateEditingState();
      clearTimeout(this.sliderDebounce);
      this.sliderDebounce = setTimeout(() => this.syncThumbnail(), 100);
    });

    this.textColorInput.addEventListener("input", (e) => {
      this.textColor = e.target.value;
      this.colorHex.textContent = this.textColor;
      this.draw();
      this.updateEditingState();
      this.syncThumbnail();
    });

    this.imageStyleSelect.addEventListener("change", (e) => {
      this.imageStyle = e.target.value;
      this.draw();
      this.updateEditingState();
      this.syncThumbnail();
    });

    this.textBoxWidthInput.addEventListener("input", (e) => {
      this.textBoxWidthPercent = parseInt(e.target.value, 10);
      this.textBoxWidthValue.textContent = this.textBoxWidthPercent;
      this.draw();
      this.updateEditingState();
      clearTimeout(this.sliderDebounce);
      this.sliderDebounce = setTimeout(() => this.syncThumbnail(), 100);
    });

    this.textBoxHeightInput.addEventListener("input", (e) => {
      this.textBoxHeightPercent = parseInt(e.target.value, 10);
      this.textBoxHeightValue.textContent = this.textBoxHeightPercent;
      this.draw();
      this.updateEditingState();
      clearTimeout(this.sliderDebounce);
      this.sliderDebounce = setTimeout(() => this.syncThumbnail(), 100);
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
    this.watermarkUpload.addEventListener("change", (e) =>
      this.handleWatermarkUpload(e),
    );

    this.allTextsTextarea.addEventListener("input", (e) => {
      const isRTL =
        /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
          e.target.value,
        );
      e.target.dir = isRTL ? "rtl" : "ltr";
      this.updateCategoryTextsPreviews();
    });
    if (this.downloadAllZipBtn) {
      this.downloadAllZipBtn.addEventListener("click", () =>
        this.downloadAllCategoriesZip(),
      );
    }
    this.resetBtn.addEventListener("click", () => this.resetToDefaults());

    if (this.customFontHeader) {
      this.customFontHeader.addEventListener("click", (e) => {
        e.stopPropagation();
        this.customFontSelect.classList.toggle("open");
        this.customFontOptions.classList.toggle("hidden");
      });

      this.customFontOptions
        .querySelectorAll(".custom-font-option")
        .forEach((opt) => {
          opt.addEventListener("click", (e) => {
            e.stopPropagation();
            const value = opt.getAttribute("data-value");
            const fontName = opt.style.fontFamily;
            const text = opt.textContent.trim();

            this.customFontSelectedText.textContent = text;
            this.customFontSelectedText.style.fontFamily = fontName;

            this.customFontOptions
              .querySelectorAll(".custom-font-option")
              .forEach((o) => o.classList.remove("active"));
            opt.classList.add("active");

            this.customFontSelect.classList.remove("open");
            this.customFontOptions.classList.add("hidden");

            this.fontFamilySelect.value = value;
            this.fontFamilySelect.dispatchEvent(new Event("change"));
          });
        });

      document.addEventListener("click", (e) => {
        if (!this.customFontSelect.contains(e.target)) {
          this.customFontSelect.classList.remove("open");
          this.customFontOptions.classList.add("hidden");
        }
      });
    }
  }

  syncThumbnail() {
    if (this.currentlyEditingGenerated) {
      const { imgIndex, genIndex } = this.currentlyEditingGenerated;
      const item = this.generatedByImage[imgIndex]?.[genIndex];
      if (!item) return;

      item.dataUrl = this.canvas.toDataURL("image/png");
      const itemEl = document.getElementById(`gen-${imgIndex}-${genIndex}`);
      if (itemEl) {
        itemEl.querySelector("img").src = item.dataUrl;
      }
    }
  }

  async downloadAllCategoriesZip() {
    let totalItems = 0;
    this.generatedByImage.forEach((items) => {
      if (items) totalItems += items.length;
    });

    if (totalItems === 0) return alert("هیچ تصویری برای دانلود وجود ندارد!");

    const btn = this.downloadAllZipBtn;
    const originalText = btn.innerText;
    btn.innerText = "در حال آماده‌سازی...";
    btn.disabled = true;

    try {
      const zip = new JSZip();

      this.generatedByImage.forEach((items, imgIndex) => {
        if (!items || items.length === 0) return;
        const folder = zip.folder(`category_${imgIndex + 1}`);
        items.forEach((item, genIndex) => {
          folder.file(`text_${genIndex + 1}.png`, item.dataUrl.split(",")[1], {
            base64: true,
          });
        });
      });

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `all_categories_${Date.now()}.zip`);
    } catch (err) {
      console.error(err);
      alert("خطا در ساخت فایل ZIP");
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }

  startDrawingZone(imgIndex) {
    const btn = document.querySelector(
      `.draw-zone-btn-thumb[data-index="${imgIndex}"]`,
    );
    if (btn) {
      btn.innerText = "✋ رسم ناحیه";
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }

    this.setActiveImage(imgIndex);
    this.isDrawingZone = true;
    this.drawingZoneForIndex = imgIndex;
    this.canvas.style.cursor = "crosshair";

    if (btn) {
      btn.innerText = "⏳ در حال رسم...";
      btn.style.backgroundColor = "#f59e0b";
      btn.style.color = "white";
    }

    document
      .querySelector(".canvas-wrapper")
      .scrollIntoView({ behavior: "smooth" });
  }

  handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    this.imageSrcs = [];
    const tempImages = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        this.imageSrcs[index] = dataUrl;

        const img = new Image();
        img.onload = async () => {
          tempImages[index] = img;
          loadedCount++;
          if (loadedCount === files.length) {
            await this.processLoadedImages(tempImages);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  async processLoadedImages(tempImages) {
    this.images = [];
    const baseWidth = tempImages[0].width;
    const baseHeight = tempImages[0].height;

    for (let index = 0; index < tempImages.length; index++) {
      const img = tempImages[index];
      if (img.width === baseWidth && img.height === baseHeight) {
        this.images[index] = await createImageBitmap(img);
      } else {
        const offscreen = document.createElement("canvas");
        offscreen.width = baseWidth;
        offscreen.height = baseHeight;
        const offCtx = offscreen.getContext("2d");
        offCtx.drawImage(img, 0, 0, baseWidth, baseHeight);
        this.images[index] = await createImageBitmap(offscreen);
      }
    }
    this.finalizeImageLoad();
  }

  finalizeImageLoad() {
    this.activeImageIndex = 0;
    this.generatedByImage = this.images.map(() => []);
    this.imageTextZones = this.images.map(() => null);

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
    this.renderCategorizedSections();
    this.setActiveImage(0);
    this.editVideoControls.classList.remove("hidden");

    // 🔥 NEW: Show batch video controls
    const batchControls = document.getElementById("batchVideoControls");
    if (batchControls) batchControls.classList.remove("hidden");
  }

  renderImageSelector() {
    const container = this.imageSelector;
    container.innerHTML = "";
    this.images.forEach((img, i) => {
      const thumb = document.createElement("div");
      thumb.className =
        "image-thumb" + (i === this.activeImageIndex ? " active" : "");

      thumb.innerHTML = `
        <img src="${this.imageSrcs[i]}" alt="Image ${i + 1}">
        <span>تصویر ${i + 1}</span>
        <button class="draw-zone-btn-thumb" data-index="${i}" style="margin-top: 8px; font-size: 0.75rem; padding: 5px 8px; width: 100%; box-sizing: border-box; background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; color: #374151; font-weight: bold;">✋ رسم ناحیه</button>
      `;

      const btn = thumb.querySelector(".draw-zone-btn-thumb");
      btn.onclick = (e) => {
        e.stopPropagation();
        this.startDrawingZone(i);
      };

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
    document
      .querySelectorAll(".image-thumb")
      .forEach((el, i) => el.classList.toggle("active", i === index));
    this.draw();
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
          <img src="${this.imageSrcs[i]}" class="category-thumb" alt="Image ${i + 1}">
          <div class="category-info">
            <h3>تصویر ${i + 1}</h3>
            <p class="category-texts-preview">هنوز متنی وارد نشده است.</p>
          </div>
          <div class="category-actions">
            <button class="primary-btn generate-cat-btn" data-index="${i}">✨ تولید</button>
            <button class="secondary-btn download-cat-btn hidden" data-index="${i}">⬇ ZIP</button>
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
    if (!this.allTextsTextarea) return;
    const lines = this.allTextsTextarea.value
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    const totalTexts = lines.length;
    const numImages = this.images.length;

    this.images.forEach((img, i) => {
      const previewEl = document.querySelector(
        `#category-${i} .category-texts-preview`,
      );
      if (previewEl) {
        if (totalTexts === 0 || numImages === 0) {
          previewEl.textContent = "هنوز متنی وارد نشده است.";
        } else {
          const baseCount = Math.floor(totalTexts / numImages);
          const remainder = totalTexts % numImages;
          const countForThis = baseCount + (i < remainder ? 1 : 0);

          if (countForThis === 0) {
            previewEl.textContent = "متنی به این تصویر اختصاص نیافته است.";
          } else {
            previewEl.textContent = `${countForThis} متن از ${totalTexts} متن به این تصویر اختصاص یافته است.`;
          }
        }
      }
    });
  }

  checkTextFits(text, fontSize, maxWidthPx, maxHeightPx) {
    const isRTL = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      text,
    );
    this.ctx.direction = isRTL ? "rtl" : "ltr";

    this.ctx.font = `${fontSize}px "${this.fontFamily}"`;
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (
        this.ctx.measureText(testLine).width > maxWidthPx &&
        currentLine !== ""
      ) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight > maxHeightPx) return false;

    for (const line of lines) {
      if (this.ctx.measureText(line).width > maxWidthPx) return false;
    }
    return true;
  }

  generateForImage(imgIndex) {
    if (!this.allTextsTextarea) return;

    const allLines = this.allTextsTextarea.value
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    if (allLines.length === 0) return alert("لطفاً حداقل یک متن وارد کنید!");

    const numImages = this.images.length;
    const baseCount = Math.floor(allLines.length / numImages);
    const remainder = allLines.length % numImages;

    let startIndex = 0;
    for (let i = 0; i < imgIndex; i++) {
      startIndex += baseCount + (i < remainder ? 1 : 0);
    }
    const countForThisImage = baseCount + (imgIndex < remainder ? 1 : 0);

    const texts = allLines.slice(startIndex, startIndex + countForThisImage);
    if (texts.length === 0)
      return alert("متنی برای این تصویر باقی نمانده است!");

    const originalImage = this.image;
    const originalText = this.text;
    const origX = this.textX,
      origY = this.textY;
    const origW = this.textBoxWidthPercent,
      origH = this.textBoxHeightPercent;
    const origFontSize = this.fontSize;

    const zone = this.imageTextZones[imgIndex];
    if (zone) {
      this.textX = zone.textX;
      this.textY = zone.textY;
      this.textBoxWidthPercent = zone.textBoxWidthPercent;
      this.textBoxHeightPercent = zone.textBoxHeightPercent;
    }

    this.image = this.images[imgIndex];
    this.generatedByImage[imgIndex] = [];
    const grid = document.getElementById(`grid-${imgIndex}`);
    grid.innerHTML = "";

    const maxWidthPx = zone
      ? (zone.textBoxWidthPercent / 100) * this.canvas.width
      : 0;
    const maxHeightPx = zone
      ? (zone.textBoxHeightPercent / 100) * this.canvas.height
      : 0;

    texts.forEach((currentText, genIndex) => {
      this.text = currentText;
      let currentFontSize = origFontSize;

      if (zone) {
        let minSize = 10;
        let maxSize = Math.min(
          1000,
          Math.ceil(Math.max(maxHeightPx / 1.4, maxWidthPx)),
        );
        let fittedSize = 10;

        while (minSize <= maxSize) {
          let midSize = Math.floor((minSize + maxSize) / 2);
          if (
            this.checkTextFits(currentText, midSize, maxWidthPx, maxHeightPx)
          ) {
            fittedSize = midSize;
            minSize = midSize + 1;
          } else {
            maxSize = midSize - 1;
          }
        }
        currentFontSize = fittedSize;
      }

      this.fontSize = currentFontSize;
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
      const isRTL =
        /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
          currentText,
        );
      const dirAttr = isRTL ? "rtl" : "ltr";

      itemEl.innerHTML = `
        <img src="${dataUrl}" alt="Generated">
        <div class="batch-item-content">
          <div class="batch-item-text" dir="${dirAttr}">${displayText}</div>
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

    this.fontSize = origFontSize;
    if (zone) {
      this.textX = origX;
      this.textY = origY;
      this.textBoxWidthPercent = origW;
      this.textBoxHeightPercent = origH;
    }
    this.image = originalImage;
    this.text = originalText;
    this.draw();
  }

  // 🔥 UPDATED: Added isBatch parameter to prevent scrolling during batch generation
  startEditingGenerated(imgIndex, genIndex, isBatch = false) {
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
    if (this.customFontOptions) {
      const customOpt = this.customFontOptions.querySelector(
        `.custom-font-option[data-value="${this.fontFamily}"]`,
      );
      if (customOpt) {
        this.customFontSelectedText.textContent = customOpt.textContent.trim();
        this.customFontSelectedText.style.fontFamily =
          customOpt.style.fontFamily;
        this.customFontOptions
          .querySelectorAll(".custom-font-option")
          .forEach((o) => o.classList.remove("active"));
        customOpt.classList.add("active");
      }
    }
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

    // 🔥 UPDATED: Only scroll if we are NOT in batch mode
    if (!isBatch) {
      document
        .querySelector(".canvas-wrapper")
        .scrollIntoView({ behavior: "smooth" });
    }
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

      const itemEl = document.getElementById(`gen-${imgIndex}-${genIndex}`);
      if (itemEl) {
        const textEl = itemEl.querySelector(".batch-item-text");
        textEl.textContent =
          this.text.length > 40
            ? this.text.substring(0, 40) + "..."
            : this.text;

        const isRTL =
          /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
            this.text,
          );
        textEl.dir = isRTL ? "rtl" : "ltr";
      }
    }
  }

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

  handleWatermarkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        this.watermarkImage = img;
        this.draw();
        this.syncThumbnail();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  drawWatermark() {
    if (!this.watermarkImage || !this.isImageLoaded) return;
    const maxDim = Math.min(this.canvas.width, this.canvas.height);
    const targetWidth = maxDim * 0.15;
    const aspectRatio = this.watermarkImage.height / this.watermarkImage.width;
    const targetHeight = targetWidth * aspectRatio;
    const margin = maxDim * 0.02;
    const x = this.canvas.width - targetWidth - margin;
    const y = this.canvas.height - targetHeight - margin;
    const originalAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = 0.7;
    this.ctx.drawImage(this.watermarkImage, x, y, targetWidth, targetHeight);
    this.ctx.globalAlpha = originalAlpha;
  }

  draw() {
    if (!this.isImageLoaded) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = "none";
    this.drawText();
    this.drawWatermark();

    if (this.tempDrawRect) {
      this.ctx.fillStyle = "rgba(37, 99, 235, 0.2)";
      this.ctx.fillRect(
        Math.min(this.tempDrawRect.x1, this.tempDrawRect.x2),
        Math.min(this.tempDrawRect.y1, this.tempDrawRect.y2),
        Math.abs(this.tempDrawRect.x2 - this.tempDrawRect.x1),
        Math.abs(this.tempDrawRect.y2 - this.tempDrawRect.y1),
      );
      this.ctx.strokeStyle = "#2563eb";
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([10, 5]);
      this.ctx.strokeRect(
        Math.min(this.tempDrawRect.x1, this.tempDrawRect.x2),
        Math.min(this.tempDrawRect.y1, this.tempDrawRect.y2),
        Math.abs(this.tempDrawRect.x2 - this.tempDrawRect.x1),
        Math.abs(this.tempDrawRect.y2 - this.tempDrawRect.y1),
      );
      this.ctx.setLineDash([]);
    }
  }

  drawText() {
    if (!this.text || !this.isImageLoaded) return;
    if (this.isDrawingZone) this.ctx.globalAlpha = 0.3;

    const isRTL = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      this.text,
    );
    this.ctx.direction = isRTL ? "rtl" : "ltr";

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
      if (y >= topBound && y + this.fontSize <= bottomBound + totalTextHeight)
        this.ctx.fillText(line, this.textX, y);
    });
    this.ctx.shadowColor = "transparent";
    if (this.isDrawingZone) this.ctx.globalAlpha = 1.0;
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
    if (this.isDrawingZone) {
      this.tempDrawRect = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
      this.draw();
      return;
    }
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
    if (this.isDrawingZone && this.tempDrawRect) {
      this.tempDrawRect.x2 = pos.x;
      this.tempDrawRect.y2 = pos.y;
      this.draw();
      return;
    }
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
    if (this.isDrawingZone && this.tempDrawRect) {
      const rect = this.tempDrawRect;
      const width = Math.abs(rect.x2 - rect.x1);
      const height = Math.abs(rect.y2 - rect.y1);

      const btn = document.querySelector(
        `.draw-zone-btn-thumb[data-index="${this.drawingZoneForIndex}"]`,
      );

      if (width > 20 && height > 20) {
        const centerX = (rect.x1 + rect.x2) / 2;
        const centerY = (rect.y1 + rect.y2) / 2;
        const widthPercent = (width / this.canvas.width) * 100;
        const heightPercent = (height / this.canvas.height) * 100;

        this.imageTextZones[this.drawingZoneForIndex] = {
          textX: centerX,
          textY: centerY,
          textBoxWidthPercent: widthPercent,
          textBoxHeightPercent: heightPercent,
        };

        if (btn) {
          btn.innerText = "✅ ناحیه رسم شد";
          btn.style.backgroundColor = "#10b981";
          btn.style.color = "white";
        }
      } else {
        if (btn) {
          btn.innerText = "✋ رسم ناحیه";
          btn.style.backgroundColor = "";
          btn.style.color = "";
        }
      }

      this.tempDrawRect = null;
      this.isDrawingZone = false;
      this.canvas.style.cursor = "crosshair";
      this.draw();
      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = "crosshair";
      this.syncThumbnail();
    }
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
    const previewDuration = 4000;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      let progress = (timestamp - startTime) / previewDuration;

      if (progress >= 1) {
        progress = 1;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
        this.applyEffect(effect, progress, timestamp, particles);
        this.ctx.filter = "none";
        this.drawText();
        this.drawWatermark();
        this.previewAnimationId = null;
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

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
      this.applyEffect(effect, progress, timestamp, particles);
      this.ctx.filter = "none";

      this.ctx.save();
      this.ctx.globalAlpha = textAlpha;
      this.ctx.translate(this.textX, this.textY);
      this.ctx.scale(textScale, textScale);
      this.ctx.translate(-this.textX, -this.textY);
      this.drawText();
      this.ctx.restore();
      this.drawWatermark();
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

      // 🔥 Try MP4 first, fall back to WebM
      const types = [
        "video/mp4; codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4",
        "video/webm; codecs=vp9,opus",
        "video/webm; codecs=vp8,opus",
        "video/webm",
      ];

      let mimeType = "video/webm";
      let ext = "webm";
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          ext = type.includes("mp4") ? "mp4" : "webm";
          console.log(`✅ Using codec: ${type}`);
          break;
        }
      }

      const recorder = new MediaRecorder(videoStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 8000000,
        audioBitsPerSecond: 192000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: mimeType });

        // Generate filename from text
        let fileName = "quote-video";
        if (this.text) {
          fileName = this.text
            .replace(/[\\/:*?"<>|]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 50);
          if (!fileName) fileName = "quote-video";
        }

        const finalFilename = `${fileName}-${Date.now()}.${ext}`;
        const blobUrl = URL.createObjectURL(videoBlob);
        const btn = this.generateVideoBtn;
        btn.innerText = `⬇ دانلود ویدیو ${ext.toUpperCase()} (کلیک کنید)`;
        btn.disabled = false;
        btn.style.backgroundColor = "#2563eb";
        btn.onclick = () => {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = finalFilename;
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

        let textAlpha = 1;
        let textScale = 1;
        const fadeInDuration = 0.15;
        if (progress < fadeInDuration) {
          const p = progress / fadeInDuration;
          const ease = 1 - Math.pow(1 - p, 3);
          textAlpha = ease;
          textScale = 0.8 + 0.2 * ease;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = this.imageStyle === "none" ? "none" : this.imageStyle;
        this.applyEffect(effect, progress, timestamp, particles);
        this.ctx.filter = "none";

        this.ctx.save();
        this.ctx.globalAlpha = textAlpha;
        this.ctx.translate(this.textX, this.textY);
        this.ctx.scale(textScale, textScale);
        this.ctx.translate(-this.textX, -this.textY);
        this.drawText();
        this.ctx.restore();
        this.drawWatermark();
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

// 🔥 UPDATED: DOMContentLoaded initialization with simplified Batch Video Manager logic
document.addEventListener("DOMContentLoaded", () => {
  const editor = new ImageEditor();

  // 🔥 NEW: Initialize Batch Video Manager
  const batchManager = new BatchVideoManager(editor);
  const batchAudioUpload = document.getElementById("batchAudioUpload");
  const batchMp3List = document.getElementById("batchMp3List");
  const batchEffectSelect = document.getElementById("batchEffectSelect"); // 🔥 NEW: Single effect dropdown
  const generateBatchVideosBtn = document.getElementById(
    "generateBatchVideosBtn",
  );
  const batchVideoDuration = document.getElementById("batchVideoDuration");
  const batchProgressContainer = document.getElementById(
    "batchProgressContainer",
  );
  const batchProgressBar = document.getElementById("batchProgressBar");
  const batchProgressText = document.getElementById("batchProgressText");

  let currentMp3Files = []; // 🔥 Simplified: Just store File objects

  // Handle MP3 Upload and UI Generation
  if (batchAudioUpload) {
    batchAudioUpload.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      currentMp3Files = files; // 🔥 Just store the files
      renderBatchMp3List();
    });
  }

  function renderBatchMp3List() {
    if (!batchMp3List) return;
    batchMp3List.innerHTML = "";
    batchMp3List.classList.remove("hidden");

    currentMp3Files.forEach((file, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "batch-mp3-item";

      // 🔥 Simplified: Just show the filename, no effect dropdown
      itemDiv.innerHTML = `
        <span class="mp3-filename" title="${file.name}">🎵 ${file.name}</span>
      `;

      batchMp3List.appendChild(itemDiv);
    });
  }

  // Handle Batch Generation Click
  if (generateBatchVideosBtn) {
    generateBatchVideosBtn.addEventListener("click", () => {
      const duration = parseFloat(batchVideoDuration.value) || 5;
      const globalEffect = batchEffectSelect.value; // 🔥 Get the single global effect

      generateBatchVideosBtn.disabled = true;
      generateBatchVideosBtn.innerText = "⏳ در حال پردازش...";
      batchProgressContainer.classList.remove("hidden");

      // 🔥 Pass mp3Files and globalEffect instead of mp3Configs
      batchManager.startGeneration(
        currentMp3Files,
        globalEffect,
        duration,
        (current, total, text) => {
          if (current === -1) {
            // Finished
            batchProgressContainer.classList.add("hidden");
            generateBatchVideosBtn.disabled = false;
            generateBatchVideosBtn.innerText = "🚀 ساخت گروهی ویدیوها";
          } else {
            // Update Progress
            const percent = (current / total) * 100;
            batchProgressBar.style.width = `${percent}%`;
            batchProgressText.innerText = text;
          }
        },
      );
    });
  }
});
