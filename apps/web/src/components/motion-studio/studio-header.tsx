import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

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
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-3 py-2">
      <div className="mr-2 flex min-w-0 items-baseline gap-2">
        <span className="text-sm font-semibold tracking-tight">LayerD</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">Motion studio</span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <PresetSelect
          disabled={!props.hasFile || props.isRendering}
          onChange={props.onPresetChange}
          preset={props.preset}
        />
        {props.error && (
          <p className="max-w-80 truncate text-xs text-destructive" title={props.error}>
            {props.error}
          </p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/history"
          className="inline-flex h-8 items-center border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
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
    </header>
  );
}
