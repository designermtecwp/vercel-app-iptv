import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "admin-config.json");

export async function GET() {
  if (!existsSync(CONFIG_PATH)) return NextResponse.json({});
  try {
    return NextResponse.json(JSON.parse(readFileSync(CONFIG_PATH, "utf-8")));
  } catch {
    return NextResponse.json({});
  }
}
