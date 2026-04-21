import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const uploadDir = path.join(process.cwd(), "uploads");

function buildSafeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${Date.now()}-${baseName || "document"}${extension}`;
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 400 });
  }

  await mkdir(uploadDir, { recursive: true });

  const fileName = buildSafeFileName(file.name);
  const filePath = path.join(uploadDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, bytes);

  return NextResponse.json({
    fileName,
    filePath: path.join("uploads", fileName),
    pdfPath: `/api/uploads/${encodeURIComponent(fileName)}`,
  });
}
