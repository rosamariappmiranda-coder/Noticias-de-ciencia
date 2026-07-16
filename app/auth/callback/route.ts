/**
 * Rota de retorno do login social (Google)
 * ---------------------------------------------------------------
 * Depois que a pessoa escolhe a conta Google, o Google a manda de
 * volta pra cá com um "código" temporário na URL. Aqui trocamos esse
 * código por uma sessão de verdade (login concluído) e devolvemos a
 * pessoa pro feed.
 *
 * Também é pra cá que aponta o link de confirmação de email.
 * ---------------------------------------------------------------
 */

import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await criarClienteServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // De volta pra home já logada.
  return NextResponse.redirect(origin);
}
