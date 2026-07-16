/**
 * BarraUsuario
 * ---------------------------------------------------------------
 * Cantinho no topo direito que mostra o estado do login:
 *  - deslogado → botão "Entrar" (leva pra /login)
 *  - logado    → "Olá, <nome>" + botão "Sair"
 *
 * É um componente de SERVIDOR (async): ele pergunta ao Supabase quem
 * é o usuário atual (pelos cookies) e, se houver, busca o nome na
 * tabela profiles. Como usa a sessão da requisição, a segurança RLS
 * garante que só o próprio perfil é lido.
 * ---------------------------------------------------------------
 */

import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";

export default async function BarraUsuario() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nome: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .single();
    // Cai pro email se o nome ainda não estiver preenchido.
    nome = perfil?.nome ?? user.email ?? null;
  }

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
      {user ? (
        <>
          <span className="font-telemetry rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs tracking-[0.1em] text-[var(--text)] uppercase backdrop-blur-sm">
            Olá, {nome}
          </span>
          <form action={sair}>
            <button
              type="submit"
              className="font-telemetry rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs tracking-[0.1em] text-[var(--text-dim)] uppercase backdrop-blur-sm transition hover:text-[var(--text)]"
            >
              Sair
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/login"
          className="font-telemetry rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-1.5 text-xs tracking-[0.1em] text-[var(--text)] uppercase backdrop-blur-sm transition hover:bg-[var(--accent)]/20"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
