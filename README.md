# My Video Agent

Mobile-first personal video production web app designed for Render Docker deployment.

## What works without external API keys
- One-click production request
- Pipeline state UI
- Story/script fallback
- Scene planning
- SVG visual generation
- eSpeak-ng fallback narration
- FFmpeg MP4 rendering
- Job polling and MP4 result link
- `/health` endpoint

## Provider integration
The app is intentionally provider-agnostic. Add AI provider integrations server-side later; never put secret API keys in `public/` or the browser.

## Render
Use **Docker** runtime. The service listens on `PORT` (Render supplies it). The included Docker image installs FFmpeg and eSpeak-ng.

Important: Render free services have resource/sleep/ephemeral-storage limits. This build is a functional foundation, not a promise of unlimited free long-form AI generation.
