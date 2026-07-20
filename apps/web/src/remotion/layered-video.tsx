import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  entranceDurationInFrames,
  reconstructedHoldInFrames,
  type LayeredVideoProps,
  type MotionPreset,
  videoDurationInFrames,
} from "./types";

type Layer = {
  id: string;
  type: string;
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function parseLayers(svg: string): Layer[] {
  return [...svg.matchAll(/<image\s+([^>]+?)\s*\/?>(?:<\/image>)?/g)].map(
    (match, index) => {
      const attributes = Object.fromEntries(
        [...match[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [
          attribute[1],
          attribute[2],
        ]),
      );

      return {
        id: attributes["data-id"] ?? String(index),
        type: attributes["data-type"] ?? "image",
        href: attributes.href ?? attributes["xlink:href"] ?? "",
        x: Number(attributes.x ?? 0),
        y: Number(attributes.y ?? 0),
        width: Number(attributes.width ?? 0),
        height: Number(attributes.height ?? 0),
      };
    },
  );
}

function sortLayers({ layers, preset }: { layers: Layer[]; preset: MotionPreset }) {
  return [...layers].sort((first, second) => {
    const firstX = first.x + first.width / 2;
    const secondX = second.x + second.width / 2;
    const firstY = first.y + first.height / 2;
    const secondY = second.y + second.height / 2;

    if (preset === "slide-up") return secondY - firstY;
    if (preset === "slide-down") return firstY - secondY;
    if (preset === "slide-left") return secondX - firstX;
    return firstX - secondX;
  });
}

function isBackground({
  layer,
  width,
  height,
}: {
  layer: Layer;
  width: number;
  height: number;
}) {
  return (
    layer.type === "background" ||
    (layer.x <= 1 &&
      layer.y <= 1 &&
      layer.width >= width * 0.98 &&
      layer.height >= height * 0.98)
  );
}

function getStartOffset({
  layer,
  preset,
  width,
  height,
}: {
  layer: Layer;
  preset: MotionPreset;
  width: number;
  height: number;
}) {
  if (preset === "slide-up") return { x: 0, y: height - layer.y + 24 };
  if (preset === "slide-down") return { x: 0, y: -(layer.y + layer.height + 24) };
  if (preset === "slide-left") return { x: width - layer.x + 24, y: 0 };
  return { x: -(layer.x + layer.width + 24), y: 0 };
}

export function LayeredVideo({ svg, preset, width, height }: LayeredVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layers = useMemo(() => parseLayers(svg), [svg]);
  const movingLayers = useMemo(
    () => layers.filter((layer) => !isBackground({ layer, width, height })),
    [height, layers, width],
  );
  const orderedLayers = useMemo(
    () => sortLayers({ layers: movingLayers, preset }),
    [movingLayers, preset],
  );
  const order = new Map(orderedLayers.map((layer, index) => [layer.id, index]));
  const lastEntranceStart =
    videoDurationInFrames - reconstructedHoldInFrames - entranceDurationInFrames;
  const stagger = lastEntranceStart / Math.max(orderedLayers.length - 1, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {layers.map((layer) => {
          const background = isBackground({ layer, width, height });
          const delay = (order.get(layer.id) ?? 0) * stagger;
          const hasSettled = frame >= delay + entranceDurationInFrames;
          const progress = background
            ? 1
            : hasSettled
              ? 1
            : spring({
                frame: frame - delay,
                fps,
                config: { damping: 18, mass: 0.7, stiffness: 130 },
                durationInFrames: entranceDurationInFrames,
              });
          const start = getStartOffset({ layer, preset, width, height });
          const x = start.x * (1 - progress);
          const y = start.y * (1 - progress);
          const opacity = background
            ? 1
            : interpolate(progress, [0, 0.2], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

          return (
            <g key={layer.id} transform={`translate(${x} ${y})`} opacity={opacity}>
              <image
                href={layer.href}
                x={layer.x}
                y={layer.y}
                width={layer.width}
                height={layer.height}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
