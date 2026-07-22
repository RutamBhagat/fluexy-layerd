import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CardHeader } from "@fluexy-layerd/ui/components/card";

import { PresetSelect } from "@/components/motion-studio/preset-select";
import { StudioActions } from "@/components/motion-studio/studio-actions";
import type { MotionPreset } from "@/remotion/types";

type StudioHeaderProps = {
  error: string;
  hasFile: boolean;
  hasSvg: boolean;
  isConverting: boolean;
  isRendering: boolean;
  onExtractLayers: () => void;
  onPresetChange: (value: MotionPreset | null) => void;
  onRenderVideo: () => void;
  preset: MotionPreset;
  renderProgress: number;
  videoUrl: string;
};

export function StudioHeader(props: StudioHeaderProps) {
  return (
    <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b">
      <div className="flex items-center gap-2">
        <PresetSelect
          disabled={!props.hasFile || props.isRendering}
          onChange={props.onPresetChange}
          preset={props.preset}
        />
        {props.error && <p className="text-xs text-destructive">{props.error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground">
          History
        </Link>
        <StudioActions
          hasFile={props.hasFile}
          hasSvg={props.hasSvg}
          isConverting={props.isConverting}
          isRendering={props.isRendering}
          onExtractLayers={props.onExtractLayers}
          onRenderVideo={props.onRenderVideo}
          renderProgress={props.renderProgress}
          videoUrl={props.videoUrl}
        />
        <UserButton />
      </div>
    </CardHeader>
  );
}
