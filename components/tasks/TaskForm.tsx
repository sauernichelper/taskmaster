"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TaskCreateInput, TaskDTO } from "@/lib/task-types";

type TaskFormProps = {
  open: boolean;
  task?: TaskDTO | null;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TaskCreateInput) => Promise<void>;
};

export function TaskForm({
  open,
  task,
  saving = false,
  onOpenChange,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = saving || uploading;

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPdfPath(task?.pdfPath ?? null);
    setPdfFile(null);
    setFileInputKey((current) => current + 1);
    setUploading(false);
    setError(null);
  }, [open, task]);

  async function uploadPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; pdfPath?: string }
      | null;

    if (!response.ok || !payload?.pdfPath) {
      throw new Error(payload?.error ?? "Unable to upload this PDF.");
    }

    return payload.pdfPath;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      setError("Enter a task title.");
      toast.error("Enter a task title.");
      return;
    }

    if (
      pdfFile &&
      pdfFile.type !== "application/pdf" &&
      !pdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Choose a PDF file.");
      toast.error("Choose a PDF file.");
      return;
    }

    setUploading(true);

    try {
      const uploadedPdfPath = pdfFile ? await uploadPdf(pdfFile) : pdfPath;

      await onSubmit({
        title: cleanTitle,
        description: cleanDescription.length > 0 ? cleanDescription : null,
        pdfPath: uploadedPdfPath,
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload this PDF.",
      );
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload this PDF.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Update the task details and keep your board current."
              : "Capture a task with enough context to move on it later."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-title">
              Title
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Design onboarding flow"
              disabled={busy}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-description">
              Description
            </label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add notes, links, or acceptance criteria."
              disabled={busy}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-pdf">
              PDF
            </label>
            <Input
              key={fileInputKey}
              id="task-pdf"
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPdfFile(file);
                setError(null);
              }}
            />
            {pdfFile || pdfPath ? (
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">
                    {pdfFile?.name ?? pdfPath?.split("/").pop()}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove attached PDF"
                  disabled={busy}
                  onClick={() => {
                    setPdfFile(null);
                    setPdfPath(null);
                    setFileInputKey((current) => current + 1);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {uploading
                ? "Uploading..."
                : saving
                  ? "Saving..."
                  : task
                    ? "Save changes"
                    : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
