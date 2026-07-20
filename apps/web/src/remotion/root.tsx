import { Composition, type CalculateMetadataFunction } from "remotion";

import { LayeredVideo } from "./layered-video";
import {
  defaultVideoProps,
  type LayeredVideoProps,
  videoDurationInFrames,
  videoFps,
} from "./types";

const calculateMetadata: CalculateMetadataFunction<LayeredVideoProps> = ({ props }) => ({
  width: props.width,
  height: props.height,
});

export function RemotionRoot() {
  return (
    <Composition
      id="LayeredVideo"
      component={LayeredVideo}
      durationInFrames={videoDurationInFrames}
      fps={videoFps}
      width={defaultVideoProps.width}
      height={defaultVideoProps.height}
      defaultProps={defaultVideoProps}
      calculateMetadata={calculateMetadata}
    />
  );
}
