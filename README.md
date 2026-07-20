# Fluexy LayerD

Local web app and Python API for converting raster designs into layered SVG ZIP exports using [LayerD](https://github.com/CyberAgentAILab/LayerD).

## Setup

Requires Node.js, npm, and [uv](https://docs.astral.sh/uv/).

```bash
npm install
uv sync --project apps/api
```

## Run

From the repository root, start each service in a separate terminal:

```bash
npm run dev:web  # http://localhost:3001
npm run dev:api  # http://127.0.0.1:8000
```

API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). The first API startup downloads the model weights.

## Test the API

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -F image=@apps/web/public/image.png \
  --output layerd-export.zip
```
