"use client";

import { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Download,
  LoaderCircle,
  Play,
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

const directionIcons = {
  "slide-up": ArrowUp,
  "slide-down": ArrowDown,
  "slide-left": ArrowLeft,
  "slide-right": ArrowRight,
};

function getSvgSize(svg: string) {
  const width = Number(svg.match(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)"/)?.[1] ?? 1080);
  const height = Number(svg.match(/<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/)?.[1] ?? 1080);

  return { width, height };
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
  const size = useMemo(() => getSvgSize(svg), [svg]);
  const inputProps = useMemo(
    () => ({ svg, preset, width: size.width, height: size.height }),
    [preset, size.height, size.width, svg],
  );

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

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
    setIsRendering(true);
    setError("");

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputProps),
      });

      if (!response.ok) throw new Error("The MP4 could not be rendered.");
      const result = (await response.json()) as { videoUrl: string };
      setVideoUrl(result.videoUrl);
    } catch (renderError) {
      setError(
        renderError instanceof Error ? renderError.message : "The MP4 could not be rendered.",
      );
    } finally {
      setIsRendering(false);
    }
  }

  const DirectionIcon = directionIcons[preset];

  return (
    <main className="mx-auto flex h-svh min-h-0 w-full max-w-7xl overflow-hidden p-4 sm:p-6">
      <Card className="min-h-0 flex-1">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b">
          <div className="flex items-center gap-2">
            <Label htmlFor="motion-preset" className="sr-only">
              Motion preset
            </Label>
            <Select value={preset} onValueChange={selectPreset} disabled={!file || isRendering}>
              <SelectTrigger id="motion-preset" className="w-44">
                <DirectionIcon className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
                {motionPresets.map((option) => {
                  const Icon = directionIcons[option.value];
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
                {isRendering ? "Rendering MP4" : videoUrl ? "Render again" : "Render MP4"}
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
