import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthCheck = {
  status: "ok" | "error";
  responseTimeMs?: number;
  message?: string;
};

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, HealthCheck> = {};

  if (!process.env.DATABASE_URL) {
    checks.database = {
      status: "error",
      message: "DATABASE_URL is not set",
    };

    return NextResponse.json(
      {
        status: "error",
        checks,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  const dbStartedAt = Date.now();

  try {
    const { prisma } = await import("@/lib/prisma");

    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "ok",
      responseTimeMs: Date.now() - dbStartedAt,
    };
  } catch (error) {
    checks.database = {
      status: "error",
      responseTimeMs: Date.now() - dbStartedAt,
      message: error instanceof Error ? error.message : "Database check failed",
    };
  }

  const isHealthy = Object.values(checks).every((check) => check.status === "ok");

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "error",
      checks,
      responseTimeMs: Date.now() - startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 },
  );
}
