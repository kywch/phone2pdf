# phone2pdf — Mobile Document Scanner Web App

## Context
Create a mobile-first static website that lets users take a photo with their phone camera, apply scan-like processing (grayscale + high contrast), convert it to a PDF, and share/email it. Deployed on GitHub Pages — no backend, everything runs client-side.

## Architecture
- **Single-page app**: `index.html` + `style.css` + `app.js`
- **No build step**: Vanilla HTML/CSS/JS, libraries loaded from CDN
- **Libraries**: [jsPDF](https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js) for PDF generation
- **Image processing**: Canvas API (no heavy dependencies like OpenCV)

## Files to Create

### 1. `index.html`
- Mobile viewport meta tag
- Simple UI layout:
  - Title/header
  - "Take Photo" button (triggers camera)
  - Preview area showing original vs processed image
  - Contrast/brightness slider for user adjustment
  - "Download PDF" button
  - "Share" button (email/share sheet)
- Hidden `<input type="file" accept="image/*" capture="environment">` for camera
- Hidden `<canvas>` elements for image processing
- Load jsPDF from CDN, app.js as module

### 2. `style.css`
- Mobile-first responsive design
- Large touch-friendly buttons
- Clean, minimal UI (dark header, light body)
- Preview image scaled to fit screen

### 3. `app.js`
Core flow:
1. **Capture**: User taps button → triggers file input → camera opens
2. **Load**: Read captured image via FileReader → draw on canvas
3. **Process**: Apply scan filter pipeline on canvas:
   - Convert to grayscale (weighted luminance: 0.299R + 0.587G + 0.114B)
   - Apply contrast boost
   - Apply adaptive threshold to get clean black/white doc look
   - User can adjust intensity via slider
4. **Preview**: Show processed result in real-time
5. **Generate PDF**: Use jsPDF to create A4 PDF with the processed image fitted to page (maintain aspect ratio)
6. **Share/Email**: Use `navigator.share({ files: [pdfBlob] })` on supported devices, fall back to download

### 4. GitHub Pages deployment
- Initialize git repo
- Create `.github/workflows/deploy.yml` or use default GitHub Pages (serve from main branch root)
- Since it's plain HTML, no build needed — just push to main and enable Pages

## Key Implementation Details

- **Camera access**: `<input type="file" accept="image/*" capture="environment">` — works on all mobile browsers, opens rear camera
- **Image processing pipeline** (all via Canvas `getImageData`/`putImageData`):
  - Grayscale conversion
  - Contrast adjustment (slider-controlled, default high)
  - Simple threshold for crisp black-on-white appearance
- **PDF sizing**: Detect image orientation (portrait/landscape), fit to A4 page with margins
- **Web Share API**: `navigator.share()` with file support — allows sending via email, messages, etc. on mobile. Falls back to simple download link on unsupported browsers.

## Verification
1. Open on mobile phone browser
2. Tap "Take Photo" → camera opens → snap a document
3. Preview shows processed (scan-like) image
4. Adjust contrast slider → preview updates
5. Tap "Download PDF" → PDF downloads with clean scanned look
6. Tap "Share" → native share sheet opens → select email → PDF attached
