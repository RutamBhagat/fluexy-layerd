"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CircleDot,
  Download,
  Eye,
  Images,
  Layers,
  LoaderCircle,
  Play,
  Shuffle,
  Sparkles,
} from "lucide-react";

import { env } from "@fluexy-layerd/env/web";
import { Button } from "@fluexy-layerd/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@fluexy-layerd/ui/components/card";
import { Input } from "@fluexy-layerd/ui/components/input";
import { Label } from "@fluexy-layerd/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fluexy-layerd/ui/components/select";

import { LayeredVideo } from "@/remotion/layered-video";
import {
  motionPresets,
  type MotionPreset,
  videoDurationInFrames,
  videoFps,
} from "@/remotion/types";

const apiUrl = env.NEXT_PUBLIC_LAYERD_API_URL;

const presetIcons = {
  "slide-up": ArrowUp,
  "slide-down": ArrowDown,
  "slide-left": ArrowLeft,
  "slide-right": ArrowRight,
  "fade-in": Eye,
  "clean-build": Layers,
  "bounce-in": Sparkles,
  "collage-toss": Images,
  "radial-explosion": CircleDot,
  "chaotic-to-organized": Shuffle,
};

function getSvgSize(svg: string) {
  const width = Number(svg.match(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)"/)?.[1] ?? 1080);
  const height = Number(svg.match(/<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/)?.[1] ?? 1080);

  return { width, height };
}

function getH264Size({ width, height }: { width: number; height: number }) {
  return {
    width: Math.floor(width / 2) * 2,
    height: Math.floor(height / 2) * 2,
  };
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [preset, setPreset] = useState<MotionPreset>("slide-up");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const renderController = useRef<AbortController | null>(null);
  const size = useMemo(() => getSvgSize(svg), [svg]);
  const renderSize = useMemo(
    () => getH264Size(size),
    [size.height, size.width],
  );
  const inputProps = useMemo(
    () => ({ svg, preset, width: size.width, height: size.height }),
    [preset, size.height, size.width, svg],
  );

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => () => renderController.current?.abort(), []);

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setSourceUrl(selectedFile ? URL.createObjectURL(selectedFile) : "");
    setSvg("");
    setVideoUrl("");
    setError("");
  }

  function selectPreset(value: MotionPreset | null) {
    if (!value) return;
    setPreset(value);
    setVideoUrl("");
  }

  async function extractLayers() {
    if (!file) return;

    setIsConverting(true);
    setError("");
    setVideoUrl("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${apiUrl}/convert`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("The image could not be separated into layers.");
      setSvg(await response.text());
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The image could not be separated into layers.",
      );
    } finally {
      setIsConverting(false);
    }
  }

  async function renderVideo() {
    const controller = new AbortController();
    renderController.current = controller;
    setIsRendering(true);
    setRenderProgress(0);
    setError("");

    try {
      const compatibility = await canRenderMediaOnWeb({
        container: "mp4",
        videoCodec: "h264",
        width: renderSize.width,
        height: renderSize.height,
        muted: true,
      });

      if (!compatibility.canRender) {
        throw new Error(compatibility.issues.map((issue) => issue.message).join(" "));
      }

      const result = await renderMediaOnWeb({
        composition: {
          id: "LayeredVideo",
          component: LayeredVideo,
          durationInFrames: videoDurationInFrames,
          fps: videoFps,
          width: renderSize.width,
          height: renderSize.height,
          defaultProps: inputProps,
        },
        inputProps,
        container: "mp4",
        videoCodec: "h264",
        muted: true,
        signal: controller.signal,
        onProgress: ({ progress }) => setRenderProgress(progress),
      });
      const blob = await result.getBlob();
      setVideoUrl(URL.createObjectURL(blob));
    } catch (renderError) {
      setError(
        renderError instanceof Error ? renderError.message : "The MP4 could not be rendered.",
      );
    } finally {
      renderController.current = null;
      setIsRendering(false);
    }
  }

  const PresetIcon = presetIcons[preset];

  return (
    <main className="mx-auto flex h-svh min-h-0 w-full max-w-7xl overflow-hidden p-4 sm:p-6">
      <Card className="min-h-0 flex-1">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b">
          <div className="flex items-center gap-2">
            <Label htmlFor="motion-preset" className="sr-only">
              Motion preset
            </Label>
            <Select value={preset} onValueChange={selectPreset} disabled={!file || isRendering}>
              <SelectTrigger id="motion-preset" className="w-52">
                <PresetIcon className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
                {motionPresets.map((option) => {
                  const Icon = presetIcons[option.value];
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <Icon className="size-3.5" />
                      <span className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-[10px] text-muted-foreground">{option.description}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2 sm:shrink-0">
            {videoUrl ? (
              <Button variant="outline" render={<a href={videoUrl} download="layerd-motion.mp4" />}>
                <Download data-icon="inline-start" />
                Download video
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Download data-icon="inline-start" />
                Download video
              </Button>
            )}
            {!svg ? (
              <Button disabled={!file || isConverting} onClick={extractLayers}>
                {isConverting ? (
                  <LoaderCircle className="animate-spin" data-icon="inline-start" />
                ) : (
                  <ArrowRight data-icon="inline-start" />
                )}
                {isConverting ? "Extracting layers" : "Create motion"}
              </Button>
            ) : (
              <Button disabled={isRendering} onClick={renderVideo}>
                {isRendering ? (
                  <LoaderCircle className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Play data-icon="inline-start" />
                )}
                {isRendering
                  ? `Rendering ${Math.round(renderProgress * 100)}%`
                  : videoUrl
                    ? "Render again"
                    : "Render MP4"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid min-h-0 flex-1 gap-6 overflow-auto lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:overflow-hidden">
          <section className="flex min-h-80 flex-col gap-3 lg:min-h-0">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="image">Source image</Label>
              <span className="max-w-48 truncate text-xs text-muted-foreground">
                {file?.name ?? "No file selected"}
              </span>
            </div>
            <Input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={isConverting || isRendering}
              onChange={selectImage}
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden border bg-muted/30">
              {sourceUrl ? (
                <img
                  src={sourceUrl}
                  alt="Selected source"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground">Choose an image to begin</p>
              )}
            </div>
          </section>

          <section className="flex min-h-80 flex-col gap-3 lg:min-h-0">
            <div className="flex items-center justify-between gap-3">
              <Label>Video preview</Label>
              {svg && (
                <span className="font-mono text-xs text-muted-foreground">
                  {size.width} × {size.height}
                </span>
              )}
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden border bg-muted/30 p-3">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-full max-w-full bg-black"
                />
              ) : svg ? (
                <Player
                  key={`${preset}-${svg.length}`}
                  component={LayeredVideo}
                  inputProps={inputProps}
                  durationInFrames={videoDurationInFrames}
                  compositionWidth={size.width}
                  compositionHeight={size.height}
                  fps={videoFps}
                  controls
                  autoPlay
                  loop
                  style={{ maxHeight: "100%", maxWidth: "100%", width: "100%" }}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your animated composition will appear here
                </p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
