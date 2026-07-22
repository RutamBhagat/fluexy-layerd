import { random, type SpringConfig } from "remotion";

export type MotionLayer = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MotionTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type TransformOptions = { layer: MotionLayer; width: number; height: number };
type Preset = {
  label: string;
  description: string;
  order: "document" | "x-ascending" | "x-descending" | "y-ascending" | "y-descending";
  animateBackground: boolean;
  easing: "linear" | Partial<SpringConfig>;
  opacityAt: number;
  getInitialTransform: (options: TransformOptions) => MotionTransform;
};

const restingTransform: MotionTransform = { x: 0, y: 0, scale: 1, rotation: 0 };
const defaultSpring = { damping: 18, mass: 0.7, stiffness: 130 };

function preset({
  label,
  description,
  getInitialTransform,
  order = "document",
  animateBackground = true,
  easing = defaultSpring,
  opacityAt = 0.2,
}: Pick<Preset, "label" | "description" | "getInitialTransform"> & Partial<Preset>): Preset {
  return { label, description, getInitialTransform, order, animateBackground, easing, opacityAt };
}

function slideUp({ layer, height }: TransformOptions) {
  return { ...restingTransform, y: height - layer.y + 24 };
}

function slideDown({ layer }: TransformOptions) {
  return { ...restingTransform, y: -(layer.y + layer.height + 24) };
}

function slideLeft({ layer, width }: TransformOptions) {
  return { ...restingTransform, x: width - layer.x + 24 };
}

function slideRight({ layer }: TransformOptions) {
  return { ...restingTransform, x: -(layer.x + layer.width + 24) };
}

function bounce({ layer, height }: TransformOptions) {
  return {
    x: 0,
    y: height * 0.18 + 40,
    scale: 0.65,
    rotation: random(`${layer.id}-bounce`) * 16 - 8,
  };
}

function toss({ layer, width, height }: TransformOptions) {
  const fromRight = random(`${layer.id}-toss-side`) > 0.5;
  return {
    x: fromRight ? width - layer.x + layer.width + 48 : -(layer.x + layer.width + 48),
    y: (random(`${layer.id}-toss-y`) - 0.5) * height * 0.5,
    scale: 0.75,
    rotation: random(`${layer.id}-toss-rotation`) * 50 - 25,
  };
}

function radial({ layer, width, height }: TransformOptions) {
  let x = layer.x + layer.width / 2 - width / 2;
  let y = layer.y + layer.height / 2 - height / 2;

  if (Math.hypot(x, y) < 1) {
    const angle = random(`${layer.id}-radial-angle`) * Math.PI * 2;
    x = Math.cos(angle);
    y = Math.sin(angle);
  }

  const length = Math.hypot(x, y);
  const distance = Math.hypot(width, height) + Math.max(layer.width, layer.height);
  return { x: (x / length) * distance, y: (y / length) * distance, scale: 1, rotation: 0 };
}

function chaos({ layer, width, height }: TransformOptions) {
  return {
    x: (random(`${layer.id}-chaos-x`) * 2 - 1) * width,
    y: (random(`${layer.id}-chaos-y`) * 2 - 1) * height,
    scale: 0.5,
    rotation: random(`${layer.id}-chaos-rotation`) * 180 - 90,
  };
}

export const motionPresets = {
  "slide-up": preset({
    label: "Slide up", description: "Bottom to top", getInitialTransform: slideUp,
    order: "y-descending", animateBackground: false,
  }),
  "slide-down": preset({
    label: "Slide down", description: "Top to bottom", getInitialTransform: slideDown,
    order: "y-ascending", animateBackground: false,
  }),
  "slide-left": preset({
    label: "Slide left", description: "Right to left", getInitialTransform: slideLeft,
    order: "x-descending", animateBackground: false,
  }),
  "slide-right": preset({
    label: "Slide right", description: "Left to right", getInitialTransform: slideRight,
    order: "x-ascending", animateBackground: false,
  }),
  "fade-in": preset({
    label: "Fade in", description: "Transparent to visible",
    getInitialTransform: () => restingTransform, easing: "linear", opacityAt: 1,
  }),
  "clean-build": preset({
    label: "Clean build", description: "Soft staggered rise",
    getInitialTransform: () => ({ ...restingTransform, y: 48 }), easing: "linear",
  }),
  "bounce-in": preset({
    label: "Bounce in", description: "Playful spring entrance", getInitialTransform: bounce,
    easing: { damping: 8, mass: 0.7, stiffness: 150 },
  }),
  "collage-toss": preset({
    label: "Collage toss", description: "Tossed in from the sides", getInitialTransform: toss,
    easing: { damping: 11, mass: 0.8, stiffness: 135 },
  }),
  "radial-explosion": preset({
    label: "Radial explosion", description: "Edges to final position", getInitialTransform: radial,
    easing: { damping: 16, mass: 0.75, stiffness: 125 },
  }),
  "chaotic-to-organized": preset({
    label: "Chaotic to organized", description: "Scattered pieces assemble",
    getInitialTransform: chaos, easing: { damping: 14, mass: 0.9, stiffness: 110 },
  }),
} as const;

export type MotionPreset = keyof typeof motionPresets;
export const motionPresetNames = Object.keys(motionPresets) as MotionPreset[];
