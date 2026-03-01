(function () {
  "use strict";

  const captureBtn = document.getElementById("capture-btn");
  const fileInput = document.getElementById("file-input");
  const captureSection = document.getElementById("capture-section");
  const previewSection = document.getElementById("preview-section");
  const previewCanvas = document.getElementById("preview-canvas");
  const processCanvas = document.getElementById("process-canvas");
  const contrastSlider = document.getElementById("contrast-slider");
  const downloadBtn = document.getElementById("download-btn");
  const shareBtn = document.getElementById("share-btn");
  const retakeBtn = document.getElementById("retake-btn");

  const previewCtx = previewCanvas.getContext("2d");
  const processCtx = processCanvas.getContext("2d");

  let originalImageData = null; // raw pixel data from the photo
  let imgWidth = 0;
  let imgHeight = 0;

  // --- Camera capture ---

  captureBtn.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = new Image();
      img.onload = function () {
        loadImage(img);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  function loadImage(img) {
    imgWidth = img.naturalWidth;
    imgHeight = img.naturalHeight;

    // Set both canvases to image dimensions
    processCanvas.width = imgWidth;
    processCanvas.height = imgHeight;
    previewCanvas.width = imgWidth;
    previewCanvas.height = imgHeight;

    // Draw original onto process canvas and store pixel data
    processCtx.drawImage(img, 0, 0);
    originalImageData = processCtx.getImageData(0, 0, imgWidth, imgHeight);

    // Apply scan filter and show preview
    applyFilter();
    showPreview();
  }

  function showPreview() {
    captureSection.hidden = true;
    previewSection.hidden = false;
  }

  // --- Image processing ---

  function applyFilter() {
    const intensity = parseInt(contrastSlider.value, 10) / 100; // 0 to 1
    const src = originalImageData.data;
    const out = processCtx.createImageData(imgWidth, imgHeight);
    const dst = out.data;

    for (let i = 0; i < src.length; i += 4) {
      const r = src[i];
      const g = src[i + 1];
      const b = src[i + 2];

      // Grayscale using luminance weights
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Contrast boost: scale around midpoint (128)
      const contrastFactor = 1 + intensity * 3; // 1x to 4x
      gray = 128 + (gray - 128) * contrastFactor;
      gray = Math.max(0, Math.min(255, gray));

      // Threshold: blend between continuous gray and hard black/white
      const threshold = gray > 128 ? 255 : 0;
      const val = Math.round(gray * (1 - intensity) + threshold * intensity);

      dst[i] = val;
      dst[i + 1] = val;
      dst[i + 2] = val;
      dst[i + 3] = 255;
    }

    processCtx.putImageData(out, 0, 0);

    // Copy to preview canvas
    previewCtx.drawImage(processCanvas, 0, 0);
  }

  contrastSlider.addEventListener("input", function () {
    if (originalImageData) {
      applyFilter();
    }
  });

  // --- PDF generation ---

  function generatePDF() {
    var jsPDF = window.jspdf.jsPDF;

    // Get processed image as JPEG data URL
    var imageData = processCanvas.toDataURL("image/jpeg", 0.92);

    // A4 dimensions in mm
    var pageWidth = 210;
    var pageHeight = 297;
    var margin = 10;
    var usableWidth = pageWidth - 2 * margin;
    var usableHeight = pageHeight - 2 * margin;

    // Fit image to page maintaining aspect ratio
    var ratio = imgWidth / imgHeight;
    var pdfW, pdfH;

    if (ratio > usableWidth / usableHeight) {
      // Wider than tall — fit to width
      pdfW = usableWidth;
      pdfH = usableWidth / ratio;
    } else {
      // Taller than wide — fit to height
      pdfH = usableHeight;
      pdfW = usableHeight * ratio;
    }

    // Center on page
    var x = margin + (usableWidth - pdfW) / 2;
    var y = margin + (usableHeight - pdfH) / 2;

    var doc = new jsPDF({ orientation: ratio > 1 ? "landscape" : "portrait" });

    if (ratio > 1) {
      // Landscape: swap page dimensions
      var lpw = 297, lph = 210;
      var luw = lpw - 2 * margin, luh = lph - 2 * margin;
      if (ratio > luw / luh) {
        pdfW = luw;
        pdfH = luw / ratio;
      } else {
        pdfH = luh;
        pdfW = luh * ratio;
      }
      x = margin + (luw - pdfW) / 2;
      y = margin + (luh - pdfH) / 2;
    }

    doc.addImage(imageData, "JPEG", x, y, pdfW, pdfH);
    return doc;
  }

  // --- Download ---

  downloadBtn.addEventListener("click", function () {
    var doc = generatePDF();
    doc.save("scanned-doc.pdf");
  });

  // --- Share / Email ---

  shareBtn.addEventListener("click", async function () {
    var doc = generatePDF();
    var blob = doc.output("blob");
    var file = new File([blob], "scanned-doc.pdf", { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Scanned Document",
          files: [file],
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          fallbackDownload(doc);
        }
      }
    } else {
      fallbackDownload(doc);
    }
  });

  function fallbackDownload(doc) {
    doc.save("scanned-doc.pdf");
  }

  // --- Retake ---

  retakeBtn.addEventListener("click", function () {
    previewSection.hidden = true;
    captureSection.hidden = false;
    originalImageData = null;
    contrastSlider.value = 50;
    fileInput.value = "";
  });
})();
