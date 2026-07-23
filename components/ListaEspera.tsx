"use client";

/**
 * ListaEspera
 * ---------------------------------------------------------------
 * O formulário de captura de e-mail da newsletter. Fica no fim do
 * feed ("Você zerou o feed") — o momento perfeito: a pessoa acabou
 * de consumir tudo e está com a atenção mais alta, querendo mais.
 *
 * Grava na tabela `lista_espera` do Supabase pelo cliente do
 * navegador. A segurança do banco (RLS) deixa QUALQUER pessoa se
 * inscrever, mas NINGUÉM ler a lista — a lista de e-mails é dado
 * sensível (LGPD) e só o painel do Supabase acessa.
 *
 * Ainda NÃO envia e-mail: por enquanto só coletamos. O envio diário
 * (com as 7 notícias mais relevantes) é a próxima etapa. Por isso o
 * texto fala em "lista de espera", não promete e-mail amanhã.
 * ---------------------------------------------------------------
 */

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

// Os quatro estados possíveis do formulário. Modelar isso como um
// "estado" só (em vez de vários booleanos soltos) evita combinações
// impossíveis, tipo "carregando E deu erro" ao mesmo tempo.
type Situacao = "parado" | "enviando" | "ok" | "erro";

export default function ListaEspera() {
  const [email, setEmail] = useState("");
  const [situacao, setSituacao] = useState<Situacao>("parado");
  const [mensagemErro, setMensagemErro] = useState("");

  // Validação simples: algo + @ + algo + . + algo. Não vale a pena
  // regex complexa — o teste real é o e-mail de confirmação chegar
  // (quando o envio existir).
  function emailPareceValido(valor: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
  }

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();

    if (!emailPareceValido(email)) {
      setMensagemErro("Esse e-mail não parece certo — confere pra mim?");
      setSituacao("erro");
      return;
    }

    setSituacao("enviando");

    try {
      const supabase = criarClienteNavegador();

      // Descobre se a pessoa está logada, só para vincular o cadastro
      // (não é obrigatório — a maioria assina deslogada).
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("lista_espera").insert({
        email: email.trim().toLowerCase(),
        origem: "fim-do-feed",
        user_id: user?.id ?? null,
      });

      if (error) {
        // Código 23505 = violação de UNIQUE, ou seja, e-mail já estava
        // na lista. Isso não é um erro pra pessoa — ela já conseguiu o
        // que queria. Tratamos como sucesso.
        if (error.code === "23505") {
          setSituacao("ok");
          return;
        }
        throw error;
      }

      setSituacao("ok");
    } catch (erro) {
      console.error("ListaEspera: falha ao gravar e-mail:", erro);
      setMensagemErro("Deu um problema aqui do nosso lado. Tenta de novo?");
      setSituacao("erro");
    }
  }

  // Estado de sucesso — troca o formulário inteiro, para não dar a
  // impressão de que dá pra assinar de novo.
  if (situacao === "ok") {
    return (
      <div
        className="vidro mt-10 w-full max-w-md rounded-2xl px-8 py-7 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-lg font-bold text-[var(--text)]">
          Pronto — você está na fila. 🚀
        </p>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Assim que a primeira edição decolar, ela chega em{" "}
          <span className="text-[var(--text)]">{email.trim().toLowerCase()}</span>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={aoEnviar}
      className="mt-10 flex w-full max-w-md flex-col items-center gap-3"
    >
      <p className="font-telemetry text-[11px] tracking-[0.15em] text-[var(--accent)] uppercase">
        Newsletter · em breve
      </p>

      <p className="text-sm text-[var(--text-dim)]">
        Entre na lista de espera e receba, todo dia, só o que importa em
        ciência e tecnologia — escolhido pelo que{" "}
        <span className="text-[var(--text)]">você</span> lê.
      </p>

      <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
        <label htmlFor="email-lista-espera" className="sr-only">
          Seu e-mail
        </label>

        <input
          id="email-lista-espera"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // Ao digitar de novo, limpa o erro anterior — dar erro
            // enquanto a pessoa corrige é irritante.
            if (situacao === "erro") setSituacao("parado");
          }}
          placeholder="seu@email.com"
          autoComplete="email"
          className="vidro flex-1 rounded-full px-5 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]"
          aria-invalid={situacao === "erro"}
          aria-describedby={situacao === "erro" ? "erro-lista-espera" : undefined}
        />

        <button
          type="submit"
          disabled={situacao === "enviando"}
          className="botao-gradiente rounded-full px-6 py-3 text-sm font-medium whitespace-nowrap disabled:opacity-60"
        >
          {situacao === "enviando" ? "Entrando..." : "Entrar na lista"}
        </button>
      </div>

      {situacao === "erro" && (
        <p
          id="erro-lista-espera"
          role="alert"
          className="text-sm text-[#ff8b8b]"
        >
          {mensagemErro}
        </p>
      )}

      <p className="font-telemetry mt-1 text-[10px] tracking-[0.15em] text-[var(--text-dim)] uppercase">
        sem spam · cancele quando quiser
      </p>
    </form>
  );
}
