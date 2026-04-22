import { NextRequest, NextResponse } from "next/server";

// Cache server-side em memória
const cache = new Map<string, {data: any, ts: number}>();
const TTL = 8 * 60 * 1000; // 8 minutos

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const decoded = decodeURIComponent(url);

  // Retornar cache se válido
  const cached = cache.get(decoded);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const res = await fetch(decoded, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    // Cachear listas grandes
    if (Array.isArray(data) && data.length > 5) {
      cache.set(decoded, { data, ts: Date.now() });
    } else if (data && typeof data === 'object') {
      cache.set(decoded, { data, ts: Date.now() });
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "MISS",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
