import { Label } from "@fluexy-layerd/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fluexy-layerd/ui/components/select";

import { motionPresetNames, motionPresets, type MotionPreset } from "@/remotion/presets";

type PresetSelectProps = {
  disabled: boolean;
  onChange: (value: MotionPreset | null) => void;
  preset: MotionPreset;
};

export function PresetSelect({ disabled, onChange, preset }: PresetSelectProps) {
  return (
    <>
      <Label htmlFor="motion-preset" className="sr-only">
        Motion preset
      </Label>
      <Select value={preset} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="motion-preset" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
          {motionPresetNames.map((name) => {
            const option = motionPresets[name];
            return (
              <SelectItem key={name} value={name}>
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
