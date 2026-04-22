import { NextResponse } from "next/server";

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
};

export async function GET() {
  try {
    const raw = process.env.ADMIN_CONFIG;
    if (raw) return NextResponse.json({ ...DEFAULT_CONFIG, ...JSON.parse(raw) });
  } catch {}
  return NextResponse.json(DEFAULT_CONFIG);
}
