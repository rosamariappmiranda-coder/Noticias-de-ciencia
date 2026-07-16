"use client";

/**
 * FormularioAuth
 * ---------------------------------------------------------------
 * A parte interativa da tela de login: alterna entre "Entrar" e
 * "Criar conta" (um `useState` simples) e mostra o formulário certo.
 *
 * Os formulários chamam as "server actions" (entrar / criarConta /
 * entrarComGoogle) direto no atributo `action` — o Next cuida de
 * enviar os dados pro servidor e rodar a função lá.
 * ---------------------------------------------------------------
 */

import { useState } from "react";
import { entrar, criarConta } from "@/app/login/actions";

export default function FormularioAuth({
  modoInicial,
}: {
  modoInicial: "entrar" | "cadastro";
}) {
  const [modo, setModo] = useState<"entrar" | "cadastro">(modoInicial);
  const ehCadastro = modo === "cadastro";

  // Classe compartilhada pelos campos de texto, pra não repetir.
  const classeCampo =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]/60 focus:bg-white/10";

  return (
    <div>
      {/* Abas Entrar / Criar conta */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/10 p-1">
        <button
          type="button"
          onClick={() => setModo("entrar")}
          className={`rounded-full py-2 text-sm transition ${
            !ehCadastro
              ? "bg-[var(--accent)] font-medium text-black"
              : "text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setModo("cadastro")}
          className={`rounded-full py-2 text-sm transition ${
            ehCadastro
              ? "bg-[var(--accent)] font-medium text-black"
              : "text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          Criar conta
        </button>
      </div>

      {/* O formulário principal. `action` recebe a server action certa
          conforme a aba. `key` força o React a recriar o form ao trocar
          de aba (limpa os campos). */}
      <form
        key={modo}
        action={ehCadastro ? criarConta : entrar}
        className="flex flex-col gap-3"
      >
        {ehCadastro && (
          <input
            name="nome"
            type="text"
            required
            placeholder="Seu nome"
            className={classeCampo}
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className={classeCampo}
        />
        <input
          name="senha"
          type="password"
          required
          minLength={6}
          placeholder="Senha (mínimo 6 caracteres)"
          autoComplete={ehCadastro ? "new-password" : "current-password"}
          className={classeCampo}
        />

        <button
          type="submit"
          className="mt-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-black transition hover:brightness-110 active:scale-[0.98]"
        >
          {ehCadastro ? "Criar minha conta" : "Entrar"}
        </button>
      </form>

      {/* Separador "ou" */}
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="font-telemetry text-[10px] tracking-[0.2em] text-[var(--text-dim)] uppercase">
          ou
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {/* Botão do Google: ainda NÃO configurado (precisa de uma
          credencial que só a Rosa gera na conta Google dela). Por
          enquanto fica desativado e marcado como "em breve", pra não
          confundir. A ação entrarComGoogle continua pronta no código
          pra quando a gente ligar. */}
      <button
        type="button"
        disabled
        title="Em breve — a gente configura o Google depois"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-[var(--text-dim)] opacity-50"
      >
        <span aria-hidden="true">🇬</span>
        Entrar com Google (em breve)
      </button>
    </div>
  );
}
