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
## Concept

The most important idea is representation change. A flat raster image only contains final pixel colors. It does not say, “this region is a title,” “this is the background,” or “move this illustration independently.” LayerD reconstructs a manipulable scene representation: separate visual fragments with positions and dimensions.

## Underlying Software Concept

This is similar to converting a screenshot back into an approximate design document. Once the system has structure rather than undifferentiated pixels, code can control each component predictably.

## Pipeline
```bash
one flat bitmap → SVG containing independently positioned image layers

---

raster image → LayerD decomposition → layered SVG → per-layer transforms → Remotion frames → MP4
```

## Concept
The animation is a deterministic function:

```
visual state = f(layer, preset, frame, canvas size)
```
There is no continuously mutating animation state. Given the same SVG, preset, and frame number, Remotion produces the same visual result.

## Underlying Software Concept

This is pure, frame-based rendering. A frame can be rendered independently without replaying all previous frames. That makes previewing, seeking, retrying, and server rendering predictable.