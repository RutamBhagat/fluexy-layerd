import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

import type { LayeredVideoProps } from "@/remotion/types";

export const maxDuration = 300;
export const runtime = "nodejs";

let bundlePromise: Promise<string> | undefined;

function getBundle() {
  bundlePromise ??= bundle({
    entryPoint: path.join(process.cwd(), "src/remotion/index.ts"),
    webpackOverride: (config) => config,
  });

  return bundlePromise;
}

export async function POST(request: Request) {
  const inputProps = (await request.json()) as LayeredVideoProps;
  const serveUrl = await getBundle();
  const composition = await selectComposition({
    serveUrl,
    id: "LayeredVideo",
    inputProps,
  });
  const rendersDirectory = path.join(process.cwd(), "public/renders");
  const filename = `${randomUUID()}.mp4`;

  await mkdir(rendersDirectory, { recursive: true });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: path.join(rendersDirectory, filename),
    inputProps,
  });

  return Response.json({ videoUrl: `/renders/${filename}` });
}
