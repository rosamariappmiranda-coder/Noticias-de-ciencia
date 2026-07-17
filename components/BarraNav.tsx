/**
 * BarraNav
 * ---------------------------------------------------------------
 * Navbar fixa de vidro no topo — a assinatura de "produto de verdade".
 * Esquerda: a marca (wordmark NEXO + tagline). Direita: a área do
 * usuário (Entrar, ou nome + Sair), que continua sendo o componente
 * de servidor BarraUsuario.
 *
 * O nome NEXO é provisório (curto, memorável, "conexão + sentido") —
 * trocar depois é mudar uma linha aqui e o title no layout.
 * ---------------------------------------------------------------
 */

import BarraUsuario from "./BarraUsuario";

export default function BarraNav() {
  return (
    <header className="vidro fixed inset-x-0 top-0 z-50 border-x-0 border-t-0">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        {/* Marca */}
        <a href="/" className="group flex items-baseline gap-3">
          <span className="font-display text-xl font-bold tracking-[-0.01em] text-[var(--text)]">
            NEX<span className="texto-gradiente">O</span>
          </span>
          <span className="font-telemetry hidden text-[10px] text-[var(--text-dim)] uppercase transition-colors group-hover:text-[var(--text)] sm:inline">
            Conhecimento
          </span>
        </a>

        {/* Área do usuário */}
        <BarraUsuario />
      </div>
    </header>
  );
}
