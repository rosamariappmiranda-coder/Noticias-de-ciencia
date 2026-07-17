/**
 * Rota do robô de notícias  →  /api/robo
 * ---------------------------------------------------------------
 * A Vercel vai chamar esta rota UMA VEZ POR DIA (agendador/cron). Ela
 * busca as notícias (lib/robo-noticias.ts) e grava no banco.
 *
 * Dois modos:
 *  - ?dry=1  → modo TESTE: só mostra o que foi buscado (não grava).
 *              Serve pra gente conferir sem precisar de senha nem deploy.
 *  - normal  → GRAVA no banco. Exige o cabeçalho de autorização com o
 *              CRON_SECRET (pra ninguém disparar o robô à toa) e usa a
 *              chave de serviço do Supabase (que passa por cima do RLS).
 * ---------------------------------------------------------------
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { agregarNoticias } from "@/lib/robo-noticias";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // o robô pode levar alguns segundos

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teste = searchParams.get("dry") === "1";

  const noticias = await agregarNoticias();

  // Modo teste: só devolve o que achou (sem gravar, sem senha).
  if (teste) {
    return NextResponse.json({
      total: noticias.length,
      porCategoria: contarPorCategoria(noticias),
      amostra: noticias.slice(0, 8),
      todas: noticias, // usado por scripts de povoamento local
    });
  }

  // Modo real: precisa do segredo do cron.
  const autorizacao = request.headers.get("authorization");
  if (autorizacao !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chaveServico) {
    return NextResponse.json(
      { erro: "SUPABASE_SERVICE_ROLE_KEY não configurada" },
      { status: 500 }
    );
  }

  // Cliente com a chave de SERVIÇO (só no servidor!) — pode gravar
  // notícias passando por cima do RLS. Nunca exponha essa chave no navegador.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    chaveServico
  );

  // upsert: insere as novas e ignora as que já existem (mesmo link).
  const { error } = await supabase
    .from("noticias")
    .upsert(noticias, { onConflict: "url_fonte", ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, processadas: noticias.length });
}

function contarPorCategoria(itens: { categoria: string }[]) {
  const contagem: Record<string, number> = {};
  for (const i of itens) contagem[i.categoria] = (contagem[i.categoria] ?? 0) + 1;
  return contagem;
}
