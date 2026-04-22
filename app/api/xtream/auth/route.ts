import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { dns, username, password } = await req.json();
  if (!dns || !username || !password)
    return NextResponse.json({ message: "Preencha todos os campos." }, { status: 400 });

  const base = dns.replace(/\/$/, "");
  const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(10000),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { 
      return NextResponse.json({ message: "Resposta inválida do servidor." }, { status: 502 });
    }

    if (data.user_info && (data.user_info.auth === 1 || data.user_info.auth === "1"))
      return NextResponse.json(data);

    return NextResponse.json({ message: "Usuário ou senha incorretos." }, { status: 401 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ message: `Não foi possível conectar: ${msg}` }, { status: 502 });
  }
}
