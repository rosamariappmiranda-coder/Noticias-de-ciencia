/**
 * Middleware do Next
 * ---------------------------------------------------------------
 * Roda antes de cada página (exceto arquivos estáticos e imagens,
 * ver `matcher` abaixo) e só chama a renovação de sessão do Supabase.
 * ---------------------------------------------------------------
 */

import { type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await atualizarSessao(request);
}

export const config = {
  // Roda em tudo, MENOS: arquivos internos do Next, o favicon e
  // imagens (que não precisam de sessão e ficariam lentas à toa).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
