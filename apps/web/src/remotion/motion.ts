import { interpolate, spring } from "remotion";

import {
  motionPresets,
  type MotionLayer,
  type MotionPreset,
  type MotionTransform,
} from "./presets";

export type { MotionLayer } from "./presets";

export function sortLayers<T extends MotionLayer>({
  layers,
  preset,
}: {
  layers: T[];
  preset: MotionPreset;
}) {
  const { order } = motionPresets[preset];
  if (order === "document") return [...layers];

  const axis = order.startsWith("x") ? "x" : "y";
  const direction = order.endsWith("ascending") ? 1 : -1;

  return [...layers].sort((first, second) => {
    const firstCenter = first[axis] + first[axis === "x" ? "width" : "height"] / 2;
    const secondCenter = second[axis] + second[axis === "x" ? "width" : "height"] / 2;
    return (firstCenter - secondCenter) * direction;
  });
}

export function getMotionProgress({
  preset,
  frame,
  delay,
  durationInFrames,
  fps,
}: {
  preset: MotionPreset;
  frame: number;
  delay: number;
  durationInFrames: number;
  fps: number;
}) {
  if (frame >= delay + durationInFrames) return 1;

  const { easing } = motionPresets[preset];
  if (easing === "linear") {
    return interpolate(frame, [delay, delay + durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return spring({ frame: frame - delay, fps, config: easing, durationInFrames });
}

export function getMotionTransform({
  layer,
  preset,
  progress,
  width,
  height,
  background,
}: {
  layer: MotionLayer;
  preset: MotionPreset;
  progress: number;
  width: number;
  height: number;
  background: boolean;
}): MotionTransform {
  if (background) return { x: 0, y: 0, scale: 1, rotation: 0 };

  const initial = motionPresets[preset].getInitialTransform({ layer, width, height });
  const remaining = 1 - progress;

  return {
    x: initial.x * remaining,
    y: initial.y * remaining,
    scale: initial.scale + (1 - initial.scale) * progress,
    rotation: initial.rotation * remaining,
  };
}
