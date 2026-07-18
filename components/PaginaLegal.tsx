/**
 * PaginaLegal — casca visual das páginas de texto (Privacidade, Termos)
 * ---------------------------------------------------------------
 * Um "molde" reutilizável: recebe o título, a data da última revisão e
 * o conteúdo, e desenha tudo dentro do visual do site (fundo escuro,
 * cartão de vidro, tipografia da marca). Assim as duas páginas legais
 * ficam idênticas em estilo, e criar uma terceira no futuro é copiar
 * pouca coisa.
 * ---------------------------------------------------------------
 */

import type { ReactNode } from "react";
import StarField from "./StarField";

export default function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string; // ex.: "18 de julho de 2026"
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen px-6 pt-24 pb-24">
      <StarField />

      <article className="vidro relative z-10 mx-auto w-full max-w-2xl rounded-3xl p-8 md:p-12">
        <a
          href="/"
          className="font-telemetry text-xs tracking-[0.2em] text-[var(--text-dim)] uppercase transition hover:text-[var(--text)]"
        >
          ← voltar ao feed
        </a>

        <h1 className="font-display mt-6 text-3xl font-bold tracking-[-0.02em] text-[var(--text)] md:text-4xl">
          {titulo}
        </h1>
        <p className="font-telemetry mt-2 text-[11px] tracking-wider text-[var(--text-dim)] uppercase">
          Última atualização: {atualizadoEm}
        </p>

        {/* prose-legal: estilos de texto corrido definidos no globals.css,
            pra deixar parágrafos, títulos e listas legíveis e espaçados. */}
        <div className="prose-legal mt-8">{children}</div>
      </article>
    </main>
  );
}
