import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "admin-config.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function getConfig() {
  if (!existsSync(CONFIG_PATH)) return {
    appName: "IPTV Player",
    appLogo: "",
    serverDns: "http://cinesmarters.top",
    primaryColor: "#7c3aed",
    welcomeMessage: "",
    notification: "",
    allowedUsers: [],
  };
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

export async function GET(req: NextRequest) {
  const pass = req.nextUrl.searchParams.get("pass");
  if (pass !== ADMIN_PASSWORD) return NextResponse.json({error:"unauthorized"},{status:401});
  return NextResponse.json(getConfig());
}

export async function POST(req: NextRequest) {
  const pass = req.nextUrl.searchParams.get("pass");
  if (pass !== ADMIN_PASSWORD) return NextResponse.json({error:"unauthorized"},{status:401});
  const body = await req.json();
  writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2));
  return NextResponse.json({ok:true});
}
