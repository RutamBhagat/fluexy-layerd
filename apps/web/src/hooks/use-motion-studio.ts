"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";

import { env } from "@fluexy-layerd/env/web";

import { LayeredVideo } from "@/remotion/layered-video";
import {
  type MotionPreset,
  videoDurationInFrames,
  videoFps,
} from "@/remotion/types";

const apiUrl = env.NEXT_PUBLIC_LAYERD_API_URL;

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

export function useMotionStudio() {
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
  const renderSize = useMemo(() => getH264Size(size), [size]);
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

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
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

  return {
    error,
    extractLayers,
    file,
    inputProps,
    isConverting,
    isRendering,
    preset,
    renderProgress,
    renderVideo,
    selectImage,
    selectPreset,
    size,
    sourceUrl,
    svg,
    videoUrl,
  };
}
