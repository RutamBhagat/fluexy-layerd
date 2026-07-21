import { Player } from "@remotion/player";

import { Label } from "@fluexy-layerd/ui/components/label";

import { LayeredVideo } from "@/remotion/layered-video";
import type { LayeredVideoProps, MotionPreset } from "@/remotion/types";
import { videoDurationInFrames, videoFps } from "@/remotion/types";

type VideoPreviewPanelProps = {
  inputProps: LayeredVideoProps;
  preset: MotionPreset;
  size: { width: number; height: number };
  svg: string;
  videoUrl: string;
};

export function VideoPreviewPanel({
  inputProps,
  preset,
  size,
  svg,
  videoUrl,
}: VideoPreviewPanelProps) {
  return (
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
  );
}
