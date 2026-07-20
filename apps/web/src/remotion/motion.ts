import { interpolate, random, spring } from "remotion";

import type { MotionPreset } from "./types";

export type MotionLayer = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type MotionTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

const posterBuildPresets: MotionPreset[] = [
  "fade-in",
  "clean-build",
  "bounce-in",
  "collage-toss",
  "radial-explosion",
  "chaotic-to-organized",
];

export function isPosterBuildPreset(preset: MotionPreset) {
  return posterBuildPresets.includes(preset);
}

function getSpringConfig(preset: MotionPreset) {
  if (preset === "bounce-in") return { damping: 8, mass: 0.7, stiffness: 150 };
  if (preset === "collage-toss") return { damping: 11, mass: 0.8, stiffness: 135 };
  if (preset === "radial-explosion") return { damping: 16, mass: 0.75, stiffness: 125 };
  if (preset === "chaotic-to-organized") {
    return { damping: 14, mass: 0.9, stiffness: 110 };
  }

  return { damping: 18, mass: 0.7, stiffness: 130 };
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

  if (preset === "fade-in" || preset === "clean-build") {
    return interpolate(frame, [delay, delay + durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return spring({
    frame: frame - delay,
    fps,
    config: getSpringConfig(preset),
    durationInFrames,
  });
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
  if (background || preset === "fade-in") {
    return { x: 0, y: 0, scale: 1, rotation: 0 };
  }

  const remaining = 1 - progress;

  if (preset === "slide-up") {
    return { x: 0, y: (height - layer.y + 24) * remaining, scale: 1, rotation: 0 };
  }
  if (preset === "slide-down") {
    return { x: 0, y: -(layer.y + layer.height + 24) * remaining, scale: 1, rotation: 0 };
  }
  if (preset === "slide-left") {
    return { x: (width - layer.x + 24) * remaining, y: 0, scale: 1, rotation: 0 };
  }
  if (preset === "slide-right") {
    return { x: -(layer.x + layer.width + 24) * remaining, y: 0, scale: 1, rotation: 0 };
  }
  if (preset === "clean-build") {
    return { x: 0, y: 48 * remaining, scale: 1, rotation: 0 };
  }
  if (preset === "bounce-in") {
    const rotation = (random(`${layer.id}-bounce`) * 16 - 8) * remaining;
    return {
      x: 0,
      y: (height * 0.18 + 40) * remaining,
      scale: 0.65 + 0.35 * progress,
      rotation,
    };
  }
  if (preset === "collage-toss") {
    const fromRight = random(`${layer.id}-toss-side`) > 0.5;
    const startX = fromRight
      ? width - layer.x + layer.width + 48
      : -(layer.x + layer.width + 48);
    return {
      x: startX * remaining,
      y: (random(`${layer.id}-toss-y`) - 0.5) * height * 0.5 * remaining,
      scale: 0.75 + 0.25 * progress,
      rotation: (random(`${layer.id}-toss-rotation`) * 50 - 25) * remaining,
    };
  }
  if (preset === "radial-explosion") {
    let directionX = layer.x + layer.width / 2 - width / 2;
    let directionY = layer.y + layer.height / 2 - height / 2;

    if (Math.hypot(directionX, directionY) < 1) {
      const angle = random(`${layer.id}-radial-angle`) * Math.PI * 2;
      directionX = Math.cos(angle);
      directionY = Math.sin(angle);
    }

    const directionLength = Math.hypot(directionX, directionY);
    const distance = Math.hypot(width, height) + Math.max(layer.width, layer.height);
    return {
      x: (directionX / directionLength) * distance * remaining,
      y: (directionY / directionLength) * distance * remaining,
      scale: 1,
      rotation: 0,
    };
  }
  if (preset === "chaotic-to-organized") {
    return {
      x: (random(`${layer.id}-chaos-x`) * 2 - 1) * width * remaining,
      y: (random(`${layer.id}-chaos-y`) * 2 - 1) * height * remaining,
      scale: 0.5 + 0.5 * progress,
      rotation: (random(`${layer.id}-chaos-rotation`) * 180 - 90) * remaining,
    };
  }

  return { x: 0, y: 0, scale: 1, rotation: 0 };
}
