# LayerD API

Local FastAPI backend that returns a self-contained LayerD SVG. Its embedded `<image>` elements can be animated independently.

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
  -F image=@../web/public/image.png \
  --output design.svg
```

## Test

```bash
uv run pytest
```
