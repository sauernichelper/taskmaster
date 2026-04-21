import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { SubtaskCreateInput } from "@/lib/task-types";
import { toSubtaskDTO } from "@/lib/task-mappers";

function normalizeSubtaskInput(body: unknown): SubtaskCreateInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const taskId = typeof data.taskId === "string" ? data.taskId.trim() : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";

  if (!taskId || !title) {
    return null;
  }

  return { taskId, title };
}

export async function POST(request: Request) {
  const input = normalizeSubtaskInput(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json(
      { error: "A task ID and subtask title are required." },
      { status: 400 },
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    select: { id: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const subtask = await prisma.subtask.create({
    data: input,
  });

  return NextResponse.json(toSubtaskDTO(subtask), { status: 201 });
}
