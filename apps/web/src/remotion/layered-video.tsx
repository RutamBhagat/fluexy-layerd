import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import {
  getMotionProgress,
  getMotionTransform,
  sortLayers,
  type MotionLayer,
} from "./motion";
import { motionPresets } from "./presets";
import {
  entranceDurationInFrames,
  reconstructedHoldInFrames,
  type LayeredVideoProps,
  videoDurationInFrames,
} from "./types";

type Layer = MotionLayer & {
  type: string;
  href: string;
};

function parseLayers(svg: string): Layer[] {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");

  return [...document.querySelectorAll("image")].map((image, index) => ({
    id: image.dataset.id ?? String(index),
    type: image.dataset.type ?? "image",
    href: image.getAttribute("href") ?? image.getAttribute("xlink:href") ?? "",
    x: Number(image.getAttribute("x") ?? 0),
    y: Number(image.getAttribute("y") ?? 0),
    width: Number(image.getAttribute("width") ?? 0),
    height: Number(image.getAttribute("height") ?? 0),
  }));
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
  const presetConfig = motionPresets[preset];
  const animatedLayers = useMemo(
    () =>
      presetConfig.animateBackground
        ? layers
        : layers.filter((layer) => !isBackground({ layer, width, height })),
    [height, layers, presetConfig.animateBackground, width],
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
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {layers.map((layer) => {
          const background = isBackground({ layer, width, height });
          const staticBackground = background && !presetConfig.animateBackground;
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
            : interpolate(progress, [0, presetConfig.opacityAt], [0, 1], {
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
