"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Download, ImageIcon, LoaderCircle } from "lucide-react";
import { Button } from "@fluexy-layerd/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fluexy-layerd/ui/components/card";
import { Input } from "@fluexy-layerd/ui/components/input";
import { Label } from "@fluexy-layerd/ui/components/label";
import { env } from "@fluexy-layerd/env/web";

const apiUrl = env.NEXT_PUBLIC_LAYERD_API_URL;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [svgUrl, setSvgUrl] = useState("");
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
    };
  }, [svgUrl]);

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setSourceUrl(selectedFile ? URL.createObjectURL(selectedFile) : "");
    setSvgUrl("");
    setError("");
  }

  async function convertImage() {
    if (!file) return;

    setIsConverting(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${apiUrl}/convert`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("The image could not be converted.");
      setSvgUrl(URL.createObjectURL(await response.blob()));
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The image could not be converted.",
      );
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <main className="flex h-svh min-h-0 w-full flex-col gap-6 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="size-4" />
          LayerD
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Turn an image into an SVG.
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose an image, convert it, then download the layered result.
        </p>
      </header>

      <Card className="min-h-0 flex-1">
        <CardHeader>
          <CardTitle>Image converter</CardTitle>
          <CardDescription>PNG, JPEG, or WebP works best.</CardDescription>
        </CardHeader>
        <CardContent className="grid min-h-0 flex-1 gap-6 overflow-auto md:grid-cols-2">
          <section className="flex min-h-72 flex-col gap-3">
            <Label htmlFor="image">Source image</Label>
            <Input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={selectImage}
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden border bg-muted/40">
              {sourceUrl ? (
                <img
                  src={sourceUrl}
                  alt="Selected source"
                  className="h-full w-full object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground">No image selected</p>
              )}
            </div>
          </section>

          <section className="flex min-h-72 flex-col gap-3">
            <Label>SVG result</Label>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden border bg-muted/40">
              {svgUrl ? (
                <img
                  src={svgUrl}
                  alt="Converted SVG"
                  className="h-full w-full object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your SVG will appear here
                </p>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </section>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <p className="truncate text-xs text-muted-foreground">
            {file?.name ?? "Choose a file to begin"}
          </p>
          <div className="flex shrink-0 gap-2">
            {svgUrl && (
              <Button variant="outline" render={<a href={svgUrl} download="layered.svg" />}>
                <Download data-icon="inline-start" />
                Download
              </Button>
            )}
            <Button disabled={!file || isConverting} onClick={convertImage}>
              {isConverting ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                <ArrowRight data-icon="inline-start" />
              )}
              {isConverting ? "Converting" : "Convert to SVG"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
