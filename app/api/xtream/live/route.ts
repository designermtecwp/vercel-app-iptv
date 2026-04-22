import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dns = searchParams.get("dns");
  const username = searchParams.get("username");
  const password = searchParams.get("password");
  const action = searchParams.get("action") || "get_live_streams";

  try {
    const res = await fetch(
      `${dns}/player_api.php?username=${username}&password=${password}&action=${action}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Erro ao buscar canais." }, { status: 502 });
  }
}
