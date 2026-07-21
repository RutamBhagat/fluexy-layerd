import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CircleDot,
  Eye,
  Images,
  Layers,
  Shuffle,
  Sparkles,
} from "lucide-react";

import { Label } from "@fluexy-layerd/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fluexy-layerd/ui/components/select";

import { motionPresets, type MotionPreset } from "@/remotion/types";

const presetIcons = {
  "slide-up": ArrowUp,
  "slide-down": ArrowDown,
  "slide-left": ArrowLeft,
  "slide-right": ArrowRight,
  "fade-in": Eye,
  "clean-build": Layers,
  "bounce-in": Sparkles,
  "collage-toss": Images,
  "radial-explosion": CircleDot,
  "chaotic-to-organized": Shuffle,
};

type PresetSelectProps = {
  disabled: boolean;
  onChange: (value: MotionPreset | null) => void;
  preset: MotionPreset;
};

export function PresetSelect({ disabled, onChange, preset }: PresetSelectProps) {
  const PresetIcon = presetIcons[preset];

  return (
    <>
      <Label htmlFor="motion-preset" className="sr-only">
        Motion preset
      </Label>
      <Select value={preset} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="motion-preset" className="w-52">
          <PresetIcon className="size-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
          {motionPresets.map((option) => {
            const Icon = presetIcons[option.value];
            return (
              <SelectItem key={option.value} value={option.value}>
                <Icon className="size-3.5" />
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-[10px] text-muted-foreground">{option.description}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
}
