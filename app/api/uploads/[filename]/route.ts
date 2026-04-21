import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    filename: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const fileName = path.basename(decodeURIComponent(params.filename));

  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", fileName);

  try {
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
