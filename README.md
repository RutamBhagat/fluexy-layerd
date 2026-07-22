# Fluexy LayerD

Turn a flat raster design into a layered motion video. A local Python API uses [LayerD](https://github.com/CyberAgentAILab/LayerD) to reconstruct the image as a self-contained SVG, then a Next.js studio animates its layers with deterministic [Remotion](https://www.remotion.dev/) presets and renders an MP4 in the browser.

```text
PNG, JPEG, or WebP → LayerD API → layered SVG → Remotion preset → MP4
```

## Features

- Separates a flat image into independently positioned SVG image layers.
- Previews motion immediately with Remotion Player.
- Includes ten deterministic presets: directional slides, fade, clean build, bounce, collage toss, radial explosion, and chaotic assembly.
- Renders a five-second, 30 fps H.264 MP4 entirely in the browser.
- Keeps the generated SVG in memory and uses temporary browser URLs for previews and downloads; nothing is persisted.

## Prerequisites

- Node.js and npm
- Python 3.11 or 3.12
- [uv](https://docs.astral.sh/uv/)
- A browser with WebCodecs and H.264 encoding support

> [!NOTE]
> The first API startup downloads the LayerD BiRefNet and LaMa model weights and can take several minutes.

## Getting started

Install the JavaScript and Python dependencies from the repository root:

```bash
npm install
uv sync --project apps/api
```

Create `apps/web/.env` with your [Clerk](https://clerk.com/) credentials:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

The browser uses `http://127.0.0.1:8000` for LayerD by default. Override it when needed:

```dotenv
NEXT_PUBLIC_LAYERD_API_URL=http://127.0.0.1:8000
```

Start the API and web studio in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open [http://localhost:3001](http://localhost:3001). The LayerD API runs at `http://127.0.0.1:8000`, with interactive documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Usage

1. Choose a PNG, JPEG, or WebP image.
2. Select a motion preset.
3. Choose **Create motion** to extract the image layers.
4. Preview the animation, then choose **Render MP4**.
5. Download the rendered video.

The output dimensions follow the LayerD SVG. H.264 requires even dimensions, so the renderer crops at most one row or column from an odd-sized source.

## API

Send an image as the `image` multipart field:

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -F image=@apps/web/public/image.png \
  --output design.svg
```

The endpoint returns a self-contained `image/svg+xml` document whose embedded image elements can be animated independently.

## Project structure

```text
apps/
├── api/        FastAPI wrapper around the LayerD pipeline
└── web/        Next.js motion studio and browser renderer
packages/
├── config/     Shared TypeScript configuration
├── db/         Drizzle and Neon workspace scaffolding
├── env/        Shared environment validation
└── ui/         Shared UI components and styles
```

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev:api` | Start the LayerD API on port 8000 |
| `npm run dev:web` | Start the web studio on port 3001 |
| `npm run dev` | Start every workspace development script |
| `npm run build` | Build workspaces that provide a build script |
| `npm run check-types` | Type-check workspaces that provide a type-check script |

## Troubleshooting

### LayerD fails on Apple silicon

The API selects MPS automatically when available. If an operation is unsupported, run the pipeline on CPU:

```bash
LAYERD_DEVICE=cpu npm run dev:api
```

### The browser cannot render the MP4

Use a browser that supports WebCodecs with H.264 encoding. Compatibility is checked before rendering, and any browser-reported issue appears in the studio.

### The web app cannot reach the API

Keep the default local ports when developing: the API currently allows browser requests from `http://localhost:3001`. If the API runs elsewhere, set `NEXT_PUBLIC_LAYERD_API_URL` to its URL and update the API CORS origin in `apps/api/app.py`.
