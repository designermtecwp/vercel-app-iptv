import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });
  const decoded = decodeURIComponent(url);
  const isM3u8 = decoded.includes(".m3u8");
  if (!isM3u8) {
    try {
      const res = await fetch(decoded, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000), cache: "no-store" });
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, { status: 200, headers: { "Content-Type": res.headers.get("content-type") || "video/mp2t", "Access-Control-Allow-Origin": "*" } });
    } catch (e: any) { return new NextResponse(e.message, { status: 502 }); }
  }
  try {
    const res = await fetch(decoded, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!res.ok) return new NextResponse("error", { status: res.status });
    let text = await res.text();
    const baseUrl = decoded.substring(0, decoded.lastIndexOf("/") + 1);
    text = text.replace(/^(?!#)(.+)$/gm, (line) => {
      const t = line.trim();
      if (!t) return line;
      const full = (t.startsWith("http://") || t.startsWith("https://")) ? t : baseUrl + t;
      return "/api/stream?url=" + encodeURIComponent(full);
    });
    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" } });
  } catch (e: any) { return new NextResponse(e.message, { status: 502 }); }
}