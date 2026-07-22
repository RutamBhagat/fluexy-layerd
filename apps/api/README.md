# LayerD API

Local FastAPI backend that returns a self-contained LayerD SVG with AI-generated semantic layer groups embedded in its metadata.

## Run on Apple silicon

From this directory:

```bash
uv sync
uv run fastapi run app.py --host 127.0.0.1 --port 8000
```

The API uses Apple's MPS device automatically when available. The first startup downloads the LayerD BiRefNet and LaMa model weights and can take several minutes. If an MPS operation is unsupported, run on CPU instead:

```bash
LAYERD_DEVICE=cpu uv run fastapi run app.py --host 127.0.0.1 --port 8000
```

Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs), or convert from the command line:

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -H 'X-API-Key: local-layerd-key' \
  -F image=@../web/public/image.png \
  --output design.svg
```

The API uses `local-layerd-key` for local development. Override it with the `LAYERD_API_KEY` environment variable.

Create `.env` in this directory for the vision grouping model:

```dotenv
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://codex-vercel-port.vercel.app/v1
OPENAI_MODEL=gpt-5.6-sol-medium
```

## Test

```bash
uv run pytest
```
