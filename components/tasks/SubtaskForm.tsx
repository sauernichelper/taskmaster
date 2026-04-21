"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SubtaskFormProps = {
  disabled?: boolean;
  onSubmit: (title: string) => Promise<void>;
};

export function SubtaskForm({ disabled = false, onSubmit }: SubtaskFormProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setSaving(true);
    try {
      await onSubmit(trimmedTitle);
      setTitle("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a subtask"
        disabled={disabled || saving}
        aria-label="Subtask title"
      />
      <Button
        type="submit"
        disabled={disabled || saving || title.trim().length === 0}
      >
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}
