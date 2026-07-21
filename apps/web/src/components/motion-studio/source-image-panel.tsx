import type { ChangeEvent } from "react";

import { Input } from "@fluexy-layerd/ui/components/input";
import { Label } from "@fluexy-layerd/ui/components/label";

type SourceImagePanelProps = {
  fileName?: string;
  isBusy: boolean;
  onSelectImage: (event: ChangeEvent<HTMLInputElement>) => void;
  sourceUrl: string;
};

export function SourceImagePanel({
  fileName,
  isBusy,
  onSelectImage,
  sourceUrl,
}: SourceImagePanelProps) {
  return (
    <section className="flex min-h-80 flex-col gap-3 lg:min-h-0">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="image">Source image</Label>
        <span className="max-w-48 truncate text-xs text-muted-foreground">
          {fileName ?? "No file selected"}
        </span>
      </div>
      <Input
        id="image"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={isBusy}
        onChange={onSelectImage}
      />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden border bg-muted/30">
        {sourceUrl ? (
          <img
            src={sourceUrl}
            alt="Selected source"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-xs text-muted-foreground">Choose an image to begin</p>
        )}
      </div>
    </section>
  );
}
