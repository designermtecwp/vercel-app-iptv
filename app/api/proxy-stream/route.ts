import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });

  const decoded = decodeURIComponent(url);

  const res = await fetch(decoded, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "video/mp4",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
