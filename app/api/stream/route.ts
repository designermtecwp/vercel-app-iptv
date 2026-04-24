import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });
  const decoded = decodeURIComponent(url);
  try {
    const res = await fetch(decoded, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!res.ok) return new NextResponse("error", { status: res.status });
    let text = await res.text();
    const baseUrl = decoded.substring(0, decoded.lastIndexOf("/") + 1);
    text = text.replace(/^(?!#)(.+)$/gm, (line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("http://")) return t.replace("http://", "https://");
      if (t.startsWith("https://")) return t;
      return baseUrl.replace("http://", "https://") + t;
    });
    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" } });
  } catch (e: any) { return new NextResponse(e.message, { status: 502 }); }
}
