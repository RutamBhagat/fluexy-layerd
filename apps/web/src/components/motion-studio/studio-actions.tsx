import { ArrowRight, Download, LoaderCircle, Play } from "lucide-react";

import { Button } from "@fluexy-layerd/ui/components/button";

type StudioActionsProps = {
  hasFile: boolean;
  hasSvg: boolean;
  isConverting: boolean;
  isRendering: boolean;
  onExtractLayers: () => void;
  onRenderVideo: () => void;
  renderProgress: number;
  videoUrl: string;
};

export function StudioActions({
  hasFile,
  hasSvg,
  isConverting,
  isRendering,
  onExtractLayers,
  onRenderVideo,
  renderProgress,
  videoUrl,
}: StudioActionsProps) {
  return (
    <div className="flex gap-2 sm:shrink-0">
      <Button
        variant="outline"
        disabled={!videoUrl}
        render={videoUrl ? <a href={videoUrl} download="layerd-motion.mp4" /> : undefined}
      >
        <Download data-icon="inline-start" />
        Download video
      </Button>
      {!hasSvg ? (
        <Button disabled={!hasFile || isConverting} onClick={onExtractLayers}>
          {isConverting ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <ArrowRight data-icon="inline-start" />
          )}
          {isConverting ? "Extracting layers" : "Create motion"}
        </Button>
      ) : (
        <Button disabled={isRendering} onClick={onRenderVideo}>
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
  );
}
