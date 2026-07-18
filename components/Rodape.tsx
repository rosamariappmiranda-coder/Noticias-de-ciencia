/**
 * Rodapé do site
 * ---------------------------------------------------------------
 * A "assinatura" no fim da página: a marca, os links legais
 * (Privacidade e Termos — exigidos pela LGPD) e o ano. Fica no fim de
 * tudo, no fluxo normal da página, então aparece depois de todo o feed.
 *
 * Usamos <a> puro (não o <Link> do Next) de propósito: recarrega a
 * página inteira ao navegar, o que evita um conflito conhecido entre o
 * GSAP (animação do foguete) e a remontagem de componentes do React.
 * ---------------------------------------------------------------
 */

export default function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <span className="font-display text-lg font-bold tracking-[-0.01em] text-[var(--text)]">
            NEX<span className="texto-gradiente">O</span>
          </span>
          <p className="font-telemetry mt-1 text-[10px] tracking-wider text-[var(--text-dim)] uppercase">
            Seu feed de conhecimento · {ano}
          </p>
        </div>

        <nav className="flex items-center gap-6 text-sm text-[var(--text-dim)]">
          <a href="/privacidade" className="transition hover:text-[var(--text)]">
            Privacidade
          </a>
          <a href="/termos" className="transition hover:text-[var(--text)]">
            Termos
          </a>
        </nav>
      </div>
    </footer>
  );
}
