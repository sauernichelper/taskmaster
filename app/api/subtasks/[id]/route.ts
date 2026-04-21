import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toSubtaskDTO } from "@/lib/task-mappers";
import type { SubtaskUpdateInput } from "@/lib/task-types";

type RouteContext = {
  params: {
    id: string;
  };
};

function normalizeSubtaskPatch(body: unknown): SubtaskUpdateInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const patch: SubtaskUpdateInput = {};

  if ("title" in data) {
    if (typeof data.title !== "string" || data.title.trim().length === 0) {
      return null;
    }

    patch.title = data.title.trim();
  }

  if ("completed" in data) {
    if (typeof data.completed !== "boolean") {
      return null;
    }

    patch.completed = data.completed;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const input = normalizeSubtaskPatch(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json(
      { error: "Provide a title or completed value to update." },
      { status: 400 },
    );
  }

  const existing = await prisma.subtask.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Subtask not found." }, { status: 404 });
  }

  const subtask = await prisma.subtask.update({
    where: { id: params.id },
    data: input,
  });

  return NextResponse.json(toSubtaskDTO(subtask));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const existing = await prisma.subtask.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Subtask not found." }, { status: 404 });
  }

  await prisma.subtask.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
