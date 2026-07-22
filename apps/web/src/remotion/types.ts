import type { MotionPreset } from "./presets";

export type { MotionPreset } from "./presets";

export type LayeredVideoProps = {
  svg: string;
  preset: MotionPreset;
  width: number;
  height: number;
};

export const defaultVideoProps: LayeredVideoProps = {
  svg: '<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg" />',
  preset: "slide-up",
  width: 1080,
  height: 1080,
};

export const videoFps = 30;
export const videoDurationInFrames = 150;
export const entranceDurationInFrames = 24;
export const reconstructedHoldInFrames = 30;
