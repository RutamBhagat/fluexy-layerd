# Fluexy LayerD

Turn a flat raster design into a layered motion video. A local Python API uses [LayerD](https://github.com/CyberAgentAILab/LayerD) to reconstruct the image as a self-contained SVG, a vision model groups related layers, and a Next.js studio animates those groups with deterministic [Remotion](https://www.remotion.dev/) presets.

```text
PNG, JPEG, or WebP → LayerD → AI grouping → layered SVG → Remotion → MP4
```

## Features

- Separates a flat image into independently positioned SVG image layers.
- Groups related text, illustrations, decorations, and calls to action with a vision model.
- Previews motion immediately with Remotion Player.
- Includes ten deterministic presets: directional slides, fade, clean build, bounce, collage toss, radial explosion, and chaotic assembly.
- Renders a five-second, 30 fps H.264 MP4 entirely in the browser.
- Saves generated SVG projects to Neon so signed-in users can reopen them without rerunning LayerD.

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
DATABASE_URL=...
```

Create `apps/api/.env` with an OpenAI-compatible vision endpoint:

```dotenv
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://codex-vercel-port.vercel.app/v1
OPENAI_MODEL=gpt-5.6-sol-medium
```

Create the project table once:

```bash
npm run db:push
```

The Next.js proxy uses `http://127.0.0.1:8000` and the shared key `local-layerd-key` by default. Override them when needed:

```dotenv
LAYERD_API_URL=http://127.0.0.1:8000
LAYERD_API_KEY=replace-me
```

When overriding the key, start Python with the same value: `LAYERD_API_KEY=replace-me npm run dev:api`.

Start the API and web studio in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open [http://localhost:3001](http://localhost:3001). The LayerD API runs at `http://127.0.0.1:8000`, with interactive documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Usage

1. Choose a PNG, JPEG, or WebP image.
2. Select a motion preset.
3. Choose **Create motion** to extract and save the image layers.
4. Preview the animation, then choose **Render MP4**.
5. Download the rendered video.

Use **History** to reopen a saved SVG and render it with another preset without running LayerD again. Rendered MP4 files remain temporary browser downloads.

The output dimensions follow the LayerD SVG. H.264 requires even dimensions, so the renderer crops at most one row or column from an odd-sized source.

## API

Send an image as the `image` multipart field:

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -H 'X-API-Key: local-layerd-key' \
  -F image=@apps/web/public/image.png \
  --output design.svg
```

The endpoint returns a self-contained SVG. Its metadata includes the AI-generated semantic groups used by Remotion.

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

Keep the default local ports when developing. The browser calls the authenticated Next.js `/api/convert` proxy, which calls FastAPI using the server-only `LAYERD_API_URL` and `LAYERD_API_KEY` values.
