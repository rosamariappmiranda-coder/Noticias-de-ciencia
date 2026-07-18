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

import { criarClienteServidor } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";

export default async function BarraUsuario() {
  // BLINDAGEM: como este componente fica na navbar de TODAS as páginas,
  // uma falha aqui derrubaria o site inteiro. Então envolvemos a
  // consulta ao Supabase num try/catch: se algo der errado (ex.: chaves
  // de ambiente ausentes), tratamos como "visitante deslogado" e o site
  // abre normalmente, em vez de estourar erro 500.
  let user: { id: string; email?: string | null } | null = null;
  let nome: string | null = null;

  try {
    const supabase = await criarClienteServidor();
    const resposta = await supabase.auth.getUser();
    user = resposta.data.user;

    if (user) {
      const { data: perfil } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .single();
      // Cai pro email se o nome ainda não estiver preenchido.
      nome = perfil?.nome ?? user.email ?? null;
    }
  } catch (erro) {
    console.error("BarraUsuario: falha ao ler sessão, tratando como deslogado:", erro);
  }

  // Vive DENTRO da BarraNav (navbar de vidro) — sem posicionamento
  // próprio, só a fileira de elementos do usuário.
  return (
    <div className="flex items-center gap-2.5">
      {user ? (
        <>
          {/* "Avatar" com a inicial do nome, em gradiente — identidade
              visual de rede social sem precisar de foto ainda. */}
          <span
            aria-hidden="true"
            className="botao-gradiente flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          >
            {(nome ?? "?").charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-sm text-[var(--text)] sm:inline">
            {nome}
          </span>
          <form action={sair}>
            <button
              type="submit"
              className="font-telemetry eleva rounded-full border border-white/10 px-3 py-1.5 text-[10px] tracking-[0.15em] text-[var(--text-dim)] uppercase hover:border-white/25 hover:text-[var(--text)]"
            >
              Sair
            </button>
          </form>
        </>
      ) : (
        // <a> comum (recarrega a página inteira) em vez de <Link> do
        // Next: garante que sair do feed pro /login sempre funcione,
        // mesmo com as animações pesadas de scroll (GSAP) na página.
        <a
          href="/login"
          className="botao-gradiente rounded-full px-5 py-1.5 text-sm font-medium"
        >
          Entrar
        </a>
      )}
    </div>
  );
}
