// src/app/api/pdf/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { ensureTempDirs, UPLOADS_DIR } from "@/lib/temp-dirs";

export const runtime = "nodejs"; // ensures not deployed to edge

export async function POST(req: NextRequest) {
  try {
    ensureTempDirs();
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Read file from form-data
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.name}`;
    const filePath = `${UPLOADS_DIR}/${uniqueFilename}`;

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath,
      filename: uniqueFilename,
      originalFilename: file.name,
      size: buffer.length
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}