import { NextRequest, NextResponse } from "next/server";

// Proxy de streaming para canais ao vivo
// Resolve Mixed Content: app (https) → servidor IPTV (http)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url required", { status: 400 });

  const decoded = decodeURIComponent(url);

  try {
    const res = await fetch(decoded, {
      headers: {
        "User-Agent": "Mozilla/5.0 (SmartTV) AppleWebKit/537.36",
        "Accept": "*/*",
      },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const isM3u8 = decoded.includes(".m3u8") || contentType.includes("mpegurl");

    if (isM3u8) {
      let text = await res.text();
      const baseUrl = decoded.substring(0, decoded.lastIndexOf("/") + 1);

      // Reescrever segmentos para passarem pelo proxy (resolve Mixed Content)
      text = text.replace(/^(?!#)(.+)$/gm, (match) => {
        if (!match.trim()) return match;
        const fullUrl = match.startsWith("http") ? match : baseUrl + match;
        return `/api/stream?url=${encodeURIComponent(fullUrl)}`;
      });

      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store",
        },
      });
    }

    // Segmentos .ts e outros binários
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    return new NextResponse(e.message || "Stream error", { status: 502 });
  }
}
