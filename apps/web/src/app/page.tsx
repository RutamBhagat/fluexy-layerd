"use client";

import { Card, CardContent } from "@fluexy-layerd/ui/components/card";

import { SourceImagePanel } from "@/components/motion-studio/source-image-panel";
import { StudioHeader } from "@/components/motion-studio/studio-header";
import { VideoPreviewPanel } from "@/components/motion-studio/video-preview-panel";
import { useMotionStudio } from "@/hooks/use-motion-studio";

export default function Home() {
  const studio = useMotionStudio();

  return (
    <main className="mx-auto flex h-svh min-h-0 w-full max-w-7xl overflow-hidden p-4 sm:p-6">
      <Card className="min-h-0 flex-1">
        <StudioHeader
          error={studio.error}
          hasFile={Boolean(studio.file)}
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

        <CardContent className="grid min-h-0 flex-1 gap-6 overflow-auto lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:overflow-hidden">
          <SourceImagePanel
            fileName={studio.file?.name}
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
        </CardContent>
      </Card>
    </main>
  );
}
