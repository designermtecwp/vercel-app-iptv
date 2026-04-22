import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });
  
  try {
    const res = await fetch(decodeURIComponent(url), {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("Content-Type") || "image/jpeg";
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}
