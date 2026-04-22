import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === "demo" && password === "password") {
    return NextResponse.json({
      token: "demo-token-123",
      subscriber: { id: 1, name: "Demo User", username: "demo", expires_at: null }
    });
  }

  try {
    const res = await fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) return NextResponse.json(data);
    return NextResponse.json({ message: data.message || "Credenciais inválidas." }, { status: 401 });
  } catch {
    return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 });
  }
}
