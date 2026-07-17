/**
 * Ícones do sistema — SVG minimalista de traço fino
 * ---------------------------------------------------------------
 * Substituem os emojis (que davam cara amadora ao site). Todos usam
 * currentColor: herdam a cor do texto ao redor, então basta mudar a
 * classe de cor do botão que o ícone acompanha. `cheio` (quando
 * existe) preenche o desenho — usado no estado ativo (curtido/salvo).
 * ---------------------------------------------------------------
 */

type PropsIcone = {
  cheio?: boolean;
  className?: string;
};

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconeCoracao({ cheio, className }: PropsIcone) {
  return (
    <svg
      {...base}
      className={className}
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
    >
      <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.1a5 5 0 1 1 7.5 6.5Z" />
    </svg>
  );
}

export function IconeComentario({ className }: PropsIcone) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor">
      <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function IconeMarcador({ cheio, className }: PropsIcone) {
  return (
    <svg
      {...base}
      className={className}
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
    >
      <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
    </svg>
  );
}

export function IconeCompartilhar({ className }: PropsIcone) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function IconeExcluir({ className }: PropsIcone) {
  return (
    <svg
      {...base}
      width={14}
      height={14}
      className={className}
      fill="none"
      stroke="currentColor"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13h10l1-13" />
    </svg>
  );
}
