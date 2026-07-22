# LayerD API

Local FastAPI backend that runs LayerD and returns the ungrouped SVG, canvas metadata, and transparent layer images. The Next.js server performs AI grouping and embeds the result in the SVG.

## Run on Apple silicon

From the repository root:

```bash
uv sync --project apps/api
uv run --project apps/api uvicorn apps.api.app:app --host 127.0.0.1 --port 8000
```

The API uses Apple's MPS device automatically when available. The first startup downloads the LayerD BiRefNet and LaMa model weights and can take several minutes. If an MPS operation is unsupported, run on CPU instead:

```bash
LAYERD_DEVICE=cpu uv run --project apps/api uvicorn apps.api.app:app --host 127.0.0.1 --port 8000
```

Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs), or convert from the command line:

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -H 'X-API-Key: local-layerd-key' \
  -F image=@apps/web/public/image.png \
  --output layers.json
```

The API uses `local-layerd-key` for local development. Override it with the `LAYERD_API_KEY` environment variable.

Create `.env` in this directory only when overriding the local API settings:

```dotenv
LAYERD_API_KEY=local-layerd-key
LAYERD_DEVICE=mps
```

The vision model settings belong in `apps/web/.env` because grouping runs in Next.js.

## Test

```bash
uv run --project apps/api pytest apps/api
```
