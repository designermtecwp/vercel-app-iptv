content = """import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });
  const decoded = decodeURIComponent(url);
  try {
    const res = await fetch(decoded, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return new NextResponse("error", { status: res.status });
    const ct = res.headers.get("Content-Type") || "";
    const isM3u8 = decoded.includes(".m3u8") || ct.includes("mpegurl");
    if (isM3u8) {
      let text = await res.text();
      const base = decoded.substring(0, decoded.lastIndexOf("/") + 1);
      text = text.replace(/^(?!#)(.+)$/gm, (line) => {
        const t = line.trim();
        if (!t) return line;
        const full = t.startsWith("http") ? t : base + t;
        return "/api/proxy-stream?url=" + encodeURIComponent(full);
      });
      return new NextResponse(text, { headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" } });
    }
    return new NextResponse(res.body, { status: 200, headers: { "Content-Type": ct || "video/mp2t", "Access-Control-Allow-Origin": "*" } });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 502 });
  }
}"""
with open("app/api/proxy-stream/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("OK")
