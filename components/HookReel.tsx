/**
 * HookReel
 * ---------------------------------------------------------------
 * O slide 1 do feed: o "gancho" logo depois da ignição do foguete
 * (HeroReel), antes das notícias começarem de verdade. Não tem foto
 * nenhuma — só tipografia, flutuando sobre o StarField (o fundo de
 * estrelas do site, que continua visível por trás porque este slide
 * não tem imagem nem cor de fundo sólida). A ideia (pedida no roadmap,
 * Fase 1, item 3) é dar um soco de impacto rápido: "isso aqui não é
 * mais um feed de brainrot, é ciência de verdade" — antes da pessoa
 * decidir se continua rolando ou não.
 *
 * Assim como NewsReel, este componente não usa nenhum hook — é função
 * pura, Server Component. A animação de entrada em cascata (label →
 * linha 1 → linha 2 → linha 3 → subfrase) é 100% CSS, disparada pelo
 * atributo `data-ativo="true"` que o ReelsFeed coloca no `<div>`
 * "wrapper" deste slide (ver classe `.linha-reel` em app/globals.css).
 * ---------------------------------------------------------------
 */

export default function HookReel() {
  return (
    <>
      {/* Glow radial bem sutil no centro da tela — não é uma "luz"
          chamativa, é só um leve aquecimento azul atrás do texto,
          reforçando a sensação de estar flutuando no espaço (o
          StarField já cuida do fundo escuro com estrelas). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(91,140,255,0.08),transparent_60%)]"
      />

      {/* Composição centrada — texto puro, sem foto. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
          {/* Linha 1 da cascata: identificação de "transmissão", no
              mesmo estilo mono das outras peças de HUD do site. */}
          <p className="linha-reel font-telemetry text-[11px] tracking-[0.35em] text-[var(--text-dim)] uppercase">
            {"// transmissão do centro de comando"}
          </p>

          {/* Frase principal: 3 linhas, cada uma sua própria
              `.linha-reel` (por isso ficam dentro de `<span>` com
              `block`, não tudo num parágrafo só) — é o que faz elas
              entrarem uma de cada vez em vez de tudo junto.

              Duas variações pra Rosa testar depois (pedido do
              roadmap): trocar o conteúdo dos 3 `<span>` abaixo por
              uma destas (mantendo a última linha em `--accent`):

              Variação A:
                "O algoritmo te empurra pra baixo."
                "Nós te lançamos"
                "pra cima."

              Variação B:
                "Menos brainrot."
                "Mais"
                "universo." */}
          <h1 className="font-display text-4xl leading-[1.15] font-bold text-[var(--text)] md:text-7xl">
            <span className="linha-reel block">Seu cérebro merece</span>
            <span className="linha-reel block">um scroll</span>
            <span className="linha-reel block text-[var(--accent)]">
              melhor.
            </span>
          </h1>

          {/* Subfrase: fonte de corpo (Sora, herdada do `<body>`),
              tom mais apagado — é a explicação em letras miúdas
              embaixo do "soco" tipográfico de cima. */}
          <p className="linha-reel max-w-md text-sm leading-relaxed text-[var(--text-dim)] md:text-base">
            Dopamina de qualidade: ciência real, verificada em 3+
            fontes, direto do espaço pro seu feed.
          </p>
        </div>
      </div>
    </>
  );
}
