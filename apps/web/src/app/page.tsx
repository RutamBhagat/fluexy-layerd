"use client";

import { SourceImagePanel } from "@/components/motion-studio/source-image-panel";
import { StudioHeader } from "@/components/motion-studio/studio-header";
import { VideoPreviewPanel } from "@/components/motion-studio/video-preview-panel";
import { useMotionStudio } from "@/hooks/use-motion-studio";

export default function Home() {
  const studio = useMotionStudio();

  return (
    <main className="h-svh overflow-hidden bg-muted/40 p-2">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden border bg-background">
        <StudioHeader
          error={studio.error}
          hasFile={Boolean(studio.file || studio.svg)}
          hasSvg={Boolean(studio.svg)}
          isConverting={studio.isConverting}
          isRendering={studio.isRendering}
          onExtractLayers={studio.extractLayers}
          onPresetChange={studio.selectPreset}
          onRenderVideo={studio.renderVideo}
          preset={studio.preset}
          renderProgress={studio.renderProgress}
          videoUrl={studio.videoUrl}
        />

        <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)] lg:divide-x lg:overflow-hidden">
          <SourceImagePanel
            fileName={studio.fileName}
            isBusy={studio.isConverting || studio.isRendering}
            onSelectImage={studio.selectImage}
            sourceUrl={studio.sourceUrl}
          />
          <VideoPreviewPanel
            inputProps={studio.inputProps}
            preset={studio.preset}
            size={studio.size}
            svg={studio.svg}
            videoUrl={studio.videoUrl}
          />
        </div>
      </div>
    </main>
  );
}
