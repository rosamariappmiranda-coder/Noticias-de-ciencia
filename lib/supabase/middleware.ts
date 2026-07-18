/**
 * Renovação de sessão no MIDDLEWARE
 * ---------------------------------------------------------------
 * O middleware roda ANTES de cada página. Aqui ele só faz UMA coisa:
 * renovar a sessão do usuário (atualizar os cookies de login que
 * expiram de tempos em tempos). Assim a pessoa continua logada ao
 * navegar, sem precisar entrar de novo.
 *
 * IMPORTANTE: aqui NÃO barramos ninguém. O feed de notícias é
 * PÚBLICO — qualquer pessoa pode ver, logada ou não. O login serve
 * pra personalizar (curtir, algoritmo), não pra bloquear a leitura.
 * Por isso não há nenhum "redirecionar pro /login" neste arquivo.
 * ---------------------------------------------------------------
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // BLINDAGEM: se por algum motivo as variáveis de ambiente não
  // estiverem disponíveis (ex.: build sem as chaves), NÃO derrubamos o
  // site inteiro. Como ler o feed é público, seguimos sem renovar a
  // sessão — a pessoa só não fica logada, mas o site abre normalmente.
  if (!url || !chave) {
    return resposta;
  }

  try {
    const supabase = createServerClient(url, chave, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          resposta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options)
          );
        },
      },
    });

    // Chamar getUser() aqui é o que de fato renova a sessão quando ela
    // está perto de expirar. Não coloque código entre criar o cliente e
    // esta chamada (recomendação oficial do Supabase pra evitar bugs de
    // logout aleatório).
    await supabase.auth.getUser();
  } catch (erro) {
    // Qualquer falha na renovação da sessão não pode quebrar a página.
    // Registramos no log da Vercel e deixamos o site abrir mesmo assim.
    console.error("Falha ao renovar sessão no middleware:", erro);
  }

  return resposta;
}
