import { NextResponse } from "next/server";

import { taskWithSubtasks, toTaskDTO } from "@/lib/task-mappers";
import { prisma } from "@/lib/prisma";
import type { TaskCreateInput } from "@/lib/task-types";

function normalizeTaskInput(body: unknown): TaskCreateInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" && data.description.trim().length > 0
      ? data.description.trim()
      : null;
  const pdfPath =
    typeof data.pdfPath === "string" && data.pdfPath.trim().length > 0
      ? data.pdfPath.trim()
      : null;
  const subtaskTitles = Array.isArray(data.subtaskTitles)
    ? data.subtaskTitles
        .filter((title): title is string => typeof title === "string")
        .map((title) => title.trim())
        .filter(Boolean)
    : [];

  if (!title) {
    return null;
  }

  return { title, description, pdfPath, subtaskTitles };
}

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: taskWithSubtasks,
    orderBy: [{ completed: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(tasks.map(toTaskDTO));
}

export async function POST(request: Request) {
  const input = normalizeTaskInput(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json(
      { error: "A task title is required." },
      { status: 400 },
    );
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      pdfPath: input.pdfPath,
      subtasks:
        input.subtaskTitles && input.subtaskTitles.length > 0
          ? {
              createMany: {
                data: input.subtaskTitles.map((title) => ({ title })),
              },
            }
          : undefined,
    },
    include: taskWithSubtasks,
  });

  return NextResponse.json(toTaskDTO(task), { status: 201 });
}
