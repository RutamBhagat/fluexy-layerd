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

type LayerGroup = MotionLayer & {
  layerIds: string[];
  role: string;
};

type GroupPlan = {
  groups: Array<{
    role: string;
    layer_ids: number[];
  }>;
};

function getGroupBounds({
  id,
  role,
  layers,
}: {
  id: string;
  role: string;
  layers: Layer[];
}): LayerGroup {
  const x = Math.min(...layers.map((layer) => layer.x));
  const y = Math.min(...layers.map((layer) => layer.y));
  const right = Math.max(...layers.map((layer) => layer.x + layer.width));
  const bottom = Math.max(...layers.map((layer) => layer.y + layer.height));

  return {
    id,
    role,
    layerIds: layers.map((layer) => layer.id),
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

function parseComposition(svg: string) {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const layers = [...document.querySelectorAll("image")].map((image, index) => ({
    id: image.dataset.id ?? String(index),
    type: image.dataset.type ?? "image",
    href: image.getAttribute("href") ?? image.getAttribute("xlink:href") ?? "",
    x: Number(image.getAttribute("x") ?? 0),
    y: Number(image.getAttribute("y") ?? 0),
    width: Number(image.getAttribute("width") ?? 0),
    height: Number(image.getAttribute("height") ?? 0),
  }));

  try {
    const metadata = document.querySelector("#layer-groups")?.textContent;
    if (!metadata) throw new Error("No grouping metadata");

    const plan = JSON.parse(metadata) as GroupPlan;
    const groups = plan.groups.map((group, index) => {
      const layerIds = new Set(group.layer_ids.map(String));
      const groupLayers = layers.filter((layer) => layerIds.has(layer.id));
      if (!groupLayers.length) throw new Error("Group has no matching layers");
      return getGroupBounds({
        id: `group-${index + 1}`,
        role: group.role,
        layers: groupLayers,
      });
    });

    return { layers, groups };
  } catch {
    return {
      layers,
      groups: layers.map((layer) =>
        getGroupBounds({ id: `layer-${layer.id}`, role: layer.type, layers: [layer] }),
      ),
    };
  }
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

function getRolePriority(role: string) {
  if (role === "background") return 0;
  if (["text", "headline", "body", "cta"].includes(role)) return 2;
  return 1;
}

export function LayeredVideo({ svg, preset, width, height }: LayeredVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { layers, groups } = useMemo(() => parseComposition(svg), [svg]);
  const presetConfig = motionPresets[preset];
  const groupByLayer = useMemo(
    () =>
      new Map(
        groups.flatMap((group) =>
          group.layerIds.map((id) => [id, group] as const),
        ),
      ),
    [groups],
  );
  const animatedGroups = useMemo(
    () =>
      presetConfig.animateBackground
        ? groups
        : groups.filter((group) => group.role !== "background"),
    [groups, presetConfig.animateBackground],
  );
  const orderedGroups = useMemo(
    () =>
      sortLayers({ layers: animatedGroups, preset }).sort(
        (first, second) =>
          getRolePriority(first.role) - getRolePriority(second.role),
      ),
    [animatedGroups, preset],
  );
  const order = new Map(orderedGroups.map((group, index) => [group.id, index]));
  const lastEntranceStart =
    videoDurationInFrames - reconstructedHoldInFrames - entranceDurationInFrames;
  const stagger = lastEntranceStart / Math.max(orderedGroups.length - 1, 1);

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
          const group = groupByLayer.get(layer.id)!;
          const background =
            group.role === "background" || isBackground({ layer, width, height });
          const staticBackground = background && !presetConfig.animateBackground;
          const delay = (order.get(group.id) ?? 0) * stagger;
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
            layer: group,
            preset,
            progress,
            width,
            height,
            background,
          });
          const centerX = group.x + group.width / 2;
          const centerY = group.y + group.height / 2;
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
