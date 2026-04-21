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

  if (!title) {
    return null;
  }

  return { title, description, pdfPath };
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
    data: input,
    include: taskWithSubtasks,
  });

  return NextResponse.json(toTaskDTO(task), { status: 201 });
}
