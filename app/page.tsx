import { TaskList } from "@/components/tasks/TaskList";
import { taskWithSubtasks, toTaskDTO } from "@/lib/task-mappers";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const tasks = await prisma.task.findMany({
    include: taskWithSubtasks,
    orderBy: [{ completed: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              TaskMaster
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-5xl">
              Plan the work. Finish the work.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Keep a focused list of open tasks, update details as scope changes,
              and clear completed work from one dashboard.
            </p>
          </div>
        </section>

        <TaskList initialTasks={tasks.map(toTaskDTO)} />
      </div>
    </main>
  );
}
