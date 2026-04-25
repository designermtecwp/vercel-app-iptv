import { NextRequest } from "next/server";
export const runtime = "edge";
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("url required", { status: 400 });
  const decoded = decodeURIComponent(url);
  try {
    const upstream = await fetch(decoded, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "*/*" },
    });
    if (!upstream.ok) return new Response("upstream error", { status: upstream.status });
    const isM3u8 = decoded.includes(".m3u8") || (upstream.headers.get("content-type") || "").includes("mpegurl");
    if (isM3u8) {
      let text = await upstream.text();
      const base = decoded.substring(0, decoded.lastIndexOf("/") + 1);
      text = text.replace(/^(?!#)(.+)$/gm, line => {
        const t = line.trim();
        if (!t) return line;
        const full = (t.startsWith("http://") || t.startsWith("https://")) ? t : base + t;
        return "/api/stream?url=" + encodeURIComponent(full);
      });
      return new Response(text, { headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" }});
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "video/mp2t",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    return new Response(e.message, { status: 502 });
  }
}