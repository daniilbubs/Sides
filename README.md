# Digitaler Raum

Minimal interactive web prototype for a university installation.

The website opens the camera, detects the human body with MediaPipe Selfie Segmentation, and replaces only the body with a monochrome digital reconstruction. Over time, the reconstruction becomes less complete, less certain, and more abstract.

The goal is not to create a glitch filter. The goal is to make the digital system feel as if it is slowly losing the ability to understand and render the person in front of it.

## Files

- `index.html` is the page.
- `styles.css` controls the simple monochrome interface.
- `app.js` contains the camera, body segmentation, and visual transformation.

## Run Locally

Camera access works on `localhost` or on an HTTPS website.

1. Open this folder in a terminal.
2. Start a small local server:

```bash
python -m http.server 8080