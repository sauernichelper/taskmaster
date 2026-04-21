import { NextResponse } from "next/server";

import { taskWithSubtasks, toTaskDTO } from "@/lib/task-mappers";
import { prisma } from "@/lib/prisma";
import type { TaskUpdateInput } from "@/lib/task-types";

type RouteContext = {
  params: {
    id: string;
  };
};

function normalizeTaskPatch(body: unknown): TaskUpdateInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const patch: TaskUpdateInput = {};

  if ("title" in data) {
    if (typeof data.title !== "string" || data.title.trim().length === 0) {
      return null;
    }

    patch.title = data.title.trim();
  }

  if ("description" in data) {
    patch.description =
      typeof data.description === "string" && data.description.trim().length > 0
        ? data.description.trim()
        : null;
  }

  if ("pdfPath" in data) {
    patch.pdfPath =
      typeof data.pdfPath === "string" && data.pdfPath.trim().length > 0
        ? data.pdfPath.trim()
        : null;
  }

  if ("completed" in data) {
    if (typeof data.completed !== "boolean") {
      return null;
    }

    patch.completed = data.completed;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: taskWithSubtasks,
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(toTaskDTO(task));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const input = normalizeTaskPatch(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json(
      { error: "Provide a title, description, PDF, or completed value to update." },
      { status: 400 },
    );
  }

  const existing = await prisma.task.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const task = await prisma.task.update({
    where: { id: params.id },
    data: input,
    include: taskWithSubtasks,
  });

  return NextResponse.json(toTaskDTO(task));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const existing = await prisma.task.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  await prisma.task.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
