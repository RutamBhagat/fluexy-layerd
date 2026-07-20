import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import {
  getMotionProgress,
  getMotionTransform,
  isPosterBuildPreset,
  type MotionLayer,
} from "./motion";
import {
  entranceDurationInFrames,
  reconstructedHoldInFrames,
  type LayeredVideoProps,
  type MotionPreset,
  videoDurationInFrames,
} from "./types";

type Layer = MotionLayer & {
  type: string;
  href: string;
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
  if (isPosterBuildPreset(preset)) return [...layers];

  return [...layers].sort((first, second) => {
    const firstX = first.x + first.width / 2;
    const secondX = second.x + second.width / 2;
    const firstY = first.y + first.height / 2;
    const secondY = second.y + second.height / 2;

    if (preset === "slide-up") return secondY - firstY;
    if (preset === "slide-down") return firstY - secondY;
    if (preset === "slide-left") return secondX - firstX;
    if (preset === "slide-right") return firstX - secondX;
    return 0;
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

export function LayeredVideo({ svg, preset, width, height }: LayeredVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layers = useMemo(() => parseLayers(svg), [svg]);
  const buildsPoster = isPosterBuildPreset(preset);
  const animatedLayers = useMemo(
    () =>
      buildsPoster ? layers : layers.filter((layer) => !isBackground({ layer, width, height })),
    [buildsPoster, height, layers, width],
  );
  const orderedLayers = useMemo(
    () => sortLayers({ layers: animatedLayers, preset }),
    [animatedLayers, preset],
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
          const staticBackground = background && !buildsPoster;
          const delay = (order.get(layer.id) ?? 0) * stagger;
          const progress = staticBackground
            ? 1
            : getMotionProgress({
                preset,
                frame,
                delay,
                durationInFrames: entranceDurationInFrames,
                fps,
              });
          const transform = getMotionTransform({
            layer,
            preset,
            progress,
            width,
            height,
            background,
          });
          const centerX = layer.x + layer.width / 2;
          const centerY = layer.y + layer.height / 2;
          const opacity = staticBackground
            ? 1
            : interpolate(progress, [0, preset === "fade-in" ? 1 : 0.2], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
          const transformValue = [
            `translate(${transform.x} ${transform.y})`,
            `rotate(${transform.rotation} ${centerX} ${centerY})`,
            `translate(${centerX} ${centerY})`,
            `scale(${transform.scale})`,
            `translate(${-centerX} ${-centerY})`,
          ].join(" ");

          return (
            <g key={layer.id} transform={transformValue} opacity={opacity}>
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
