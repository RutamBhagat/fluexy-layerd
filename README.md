# Fluexy LayerD

Turn a flat raster design into a layered motion video. A local Python API uses [LayerD](https://github.com/CyberAgentAILab/LayerD) to produce a self-contained SVG, then the web app animates its layers with deterministic Remotion presets.

## How it works

```text
image → LayerD API → layered SVG → Remotion preset → browser-rendered MP4
```

1. Upload a PNG, JPEG, or WebP image.
2. LayerD reconstructs it as independently positioned SVG image layers.
3. Choose a motion preset and preview it with Remotion Player.
4. Export an MP4 in the browser with WebCodecs.

Rendered videos are temporary Blob URLs used for preview and download. They are not uploaded or persisted, and no FFmpeg render server is required.

## Requirements

- Node.js and npm
- [uv](https://docs.astral.sh/uv/)
- A browser with WebCodecs and H.264 encoding support

## Setup

```bash
npm install
uv sync --project apps/api
```

Create `apps/web/.env` with your Clerk credentials:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

`NEXT_PUBLIC_LAYERD_API_URL` defaults to `http://127.0.0.1:8000`.

## Run

Start both services from the repository root:

```bash
npm run dev:api  # http://127.0.0.1:8000
npm run dev:web  # http://localhost:3001
```

The first API startup downloads the LayerD model weights. API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

On Apple silicon, the API selects MPS when available. Use CPU if an operation is unsupported:

```bash
LAYERD_DEVICE=cpu npm run dev:api
```

## API example

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -F image=@apps/web/public/image.png \
  --output design.svg
```

The response content type is `image/svg+xml`.

## Design notes

Motion is a deterministic function of the layer, preset, frame, and canvas size. Curated presets keep output reproducible and ensure every animation resolves to the reconstructed design without generated animation code or an LLM evaluator.

H.264 requires even dimensions because its common YUV 4:2:0 format groups pixels into 2×2 blocks. The exporter rounds odd dimensions down and crops at most one row or column, avoiding letterboxing.
