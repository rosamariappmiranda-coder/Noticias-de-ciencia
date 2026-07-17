/**
 * Página de Login / Criar conta
 * ---------------------------------------------------------------
 * Componente de SERVIDOR: só lê os parâmetros da URL (mensagens de
 * erro/sucesso, e qual aba abrir) e monta a tela. A parte interativa
 * (trocar entre "Entrar" e "Criar conta", digitar) fica no
 * FormularioAuth, que é um componente de navegador.
 * ---------------------------------------------------------------
 */

import Link from "next/link";
import StarField from "@/components/StarField";
import FormularioAuth from "@/components/FormularioAuth";

export default async function LoginPage({
  searchParams,
}: {
  // No Next 15 os parâmetros da URL chegam como Promise.
  searchParams: Promise<{ modo?: string; erro?: string; mensagem?: string }>;
}) {
  const params = await searchParams;
  const modoInicial = params.modo === "cadastro" ? "cadastro" : "entrar";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <StarField />

      <div className="vidro relative z-10 w-full max-w-sm rounded-3xl p-8">
        <Link
          href="/"
          className="font-telemetry text-xs tracking-[0.2em] text-[var(--text-dim)] uppercase transition hover:text-[var(--text)]"
        >
          ← voltar ao feed
        </Link>

        <h1 className="font-display mt-6 text-2xl font-bold tracking-[0.06em] text-[var(--text)] uppercase">
          Notícias das Estrelas
        </h1>
        <p className="font-telemetry mt-1 mb-6 text-xs tracking-[0.15em] text-[var(--text-dim)] uppercase">
          entre pra ter um feed só seu
        </p>

        {/* Mensagem de erro (vermelha) ou de sucesso (azul), quando a
            ação de login/cadastro devolve alguma. */}
        {params.erro && (
          <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {params.erro}
          </p>
        )}
        {params.mensagem && (
          <p className="mb-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text)]">
            {params.mensagem}
          </p>
        )}

        <FormularioAuth modoInicial={modoInicial} />
      </div>
    </main>
  );
}
