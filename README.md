# Fluexy LayerD

Local web app and Python API for converting raster designs into self-contained layered SVGs using [LayerD](https://github.com/CyberAgentAILab/LayerD). Each SVG `<image>` element can be animated independently.

## Why deterministic motion

The app uses curated motion presets instead of LLM-generated animation code. Motion is a constrained, deterministic task here: layer geometry controls ordering and trajectories, seeded variation stays reproducible, and every animation resolves to the reconstructed source image. This produces more consistent and inspectable results than giving an LLM control of transforms or timing.

For the same reason, the render path does not use an LLM evaluator. Output correctness can be checked directly through deterministic invariants such as valid layers, successful rendering, and exact final-frame reconstruction; a subjective model-based evaluation loop would add latency and variability without improving those guarantees.

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

On Apple silicon, the API uses MPS automatically. LayerD does not explicitly document MPS support, but its models use standard PyTorch device APIs, so they work when PyTorch supports every required operation. Use `LAYERD_DEVICE=cpu npm run dev:api` if an MPS operation fails.

## Test the API

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -F image=@apps/web/public/image.png \
  --output design.svg
```

The response content type is `image/svg+xml`.

## Test

```bash
uv run --project apps/api pytest apps/api/tests
```
