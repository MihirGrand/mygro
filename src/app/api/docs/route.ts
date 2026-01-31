import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const docsPath = path.join(
      process.cwd(),
      "src",
      "app",
      "(main)",
      "v2",
      "docs.md"
    );

    const content = await fs.readFile(docsPath, "utf-8");

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error reading docs:", error);
    return new NextResponse("Documentation not found", { status: 404 });
  }
}
