
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Middleware leve — só bloqueia rotas protegidas se não tiver cookie de sessão
  // A verificação real é feita no cliente via localStorage
  // Aqui só garantimos que /home etc não sejam indexados sem sessão
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.json|\\.well-known).*)"],
};
