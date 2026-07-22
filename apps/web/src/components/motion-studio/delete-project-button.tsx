"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@fluexy-layerd/ui/components/button";

type DeleteProjectButtonProps = {
  filename: string;
  projectId: string;
};

export function DeleteProjectButton({
  filename,
  projectId,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteProject() {
    if (!window.confirm(`Delete ${filename}? This cannot be undone.`)) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Project could not be deleted");

      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Project could not be deleted");
      setIsDeleting(false);
    }
  }

  return (
    <Button
      aria-label={`Delete ${filename}`}
      disabled={isDeleting}
      onClick={deleteProject}
      size="icon"
      title={`Delete ${filename}`}
      variant="destructive"
    >
      {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
