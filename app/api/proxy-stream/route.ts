import { NextRequest, NextResponse } from "next/server";

const REPLIT_PROXY = "https://iptv-manager--luizdori.replit.app/api/xtream/stream";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });

  const decoded = decodeURIComponent(url);

  try {
    const res = await fetch(`${REPLIT_PROXY}?url=${encodeURIComponent(decoded)}`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "*/*" },
    });

    if (!res.ok) return new NextResponse("upstream error", { status: res.status });

    const ct = res.headers.get("Content-Type") || "";
    const isM3u8 = decoded.includes(".m3u8") || ct.includes("mpegurl");

    if (isM3u8) {
      let text = await res.text();
      text = text.replace(/^(?!#)(.+)$/gm, (line) => {
        const t = line.trim();
        if (!t) return line;
        return "/api/proxy-stream?url=" + encodeURIComponent(t);
      });
      return new NextResponse(text, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": ct || "video/mp2t",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 502 });
  }
}