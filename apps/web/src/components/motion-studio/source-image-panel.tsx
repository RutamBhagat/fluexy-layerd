import { ImagePlus } from "lucide-react";
import { useDropzone } from "react-dropzone";

type SourceImagePanelProps = {
  fileName?: string;
  isBusy: boolean;
  onSelectImage: (file: File) => void;
  sourceUrl: string;
};

export function SourceImagePanel({
  fileName,
  isBusy,
  onSelectImage,
  sourceUrl,
}: SourceImagePanelProps) {
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    disabled: isBusy,
    multiple: false,
    onDropAccepted: (files) => {
      const [file] = files;
      if (file) onSelectImage(file);
    },
  });

  return (
    <section className="flex min-h-[28rem] flex-col lg:min-h-0">
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b px-3">
        <h2 className="text-xs font-medium">Source image</h2>
        <span className="max-w-48 truncate text-xs text-muted-foreground">
          {fileName || "No file selected"}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 p-2">
        <div
          {...getRootProps({
            "aria-label": "Choose or drop a source image",
            className: `group relative flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden border border-dashed outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
              isDragActive ? "border-foreground bg-muted" : "bg-muted/20 hover:bg-muted/40"
            } ${isBusy ? "pointer-events-none opacity-50" : ""}`,
          })}
        >
          <input {...getInputProps()} />
          {sourceUrl ? (
            <>
              <img
                src={sourceUrl}
                alt="Selected source"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute bottom-2 left-2 border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
                {isDragActive ? "Drop to replace" : "Drop or click to replace"}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="size-5" />
              <p className="text-xs text-foreground">
                {isDragActive ? "Drop image here" : "Drop image or click to browse"}
              </p>
              <p className="text-[10px]">PNG, JPEG, or WebP</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
