import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const DEFAULT_CONFIG = {
  appName: "IPTV WEB PLAYER",
  appLogo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/IPTV.png",
  loginLogo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/IPTV.png",
  loginTitle: "Login",
  loginSubtitle: "",
  serverDns: "",
  serverDnsList: [],
  primaryColor: "#114bc0",
  welcomeMessage: "Bem vindo",
  notification: "",
  allowedUsers: [],
  appDomain: process.env.NEXT_PUBLIC_APP_URL || "",
};

function getConfig() {
  try {
    const raw = process.env.ADMIN_CONFIG;
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

export async function GET(req: NextRequest) {
  const pass = req.nextUrl.searchParams.get("pass");
  if (pass !== ADMIN_PASSWORD)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(getConfig());
}

export async function POST(req: NextRequest) {
  const pass = req.nextUrl.searchParams.get("pass");
  if (pass !== ADMIN_PASSWORD)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  return NextResponse.json({ ok: false, vercel: true, config: body });
}
