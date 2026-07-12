"use client";

/**
 * ReelsFeed
 * ---------------------------------------------------------------
 * O CONTÊINER do novo feed estilo TikTok/Reels: a partir de agora,
 * é ESTE elemento que rola — não mais o `<body>` da página (ver
 * `overflow: hidden` adicionado em app/globals.css). Dentro dele
 * moram, em sequência vertical: o slide 0 (`HeroReel`, a ignição do
 * foguete), o slide 1 (`HookReel`, o gancho de impacto "Centro de
 * Comando") e depois um slide por notícia (`NewsReel`).
 *
 * "Scroll-snap" (`snap-y snap-mandatory` + `snap-start snap-always`
 * em cada slide) é um recurso NATIVO do CSS — sem nenhuma biblioteca
 * — que faz o navegador "encaixar" a rolagem exatamente no início de
 * cada slide, em vez de parar em qualquer posição no meio do
 * caminho. `snap-always` (que vira `scroll-snap-stop: always` no
 * CSS puro) é o que garante que UM gesto de rolagem (roda do mouse,
 * swipe, seta) pare sempre no PRÓXIMO slide, nunca pulando vários de
 * uma vez — é isso que dá a sensação de Reels/TikTok.
 *
 * Como sabemos qual slide está "ativo" (visível na tela agora)? Com
 * um `IntersectionObserver`: o navegador nos avisa sozinho quando
 * cada slide entra/sai da área visível do contêiner, sem a gente
 * precisar calcular posições de scroll na mão.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import { noticias } from "@/content/noticias";
import HeroReel from "@/components/HeroReel";
import HookReel from "@/components/HookReel";
import NewsReel from "@/components/NewsReel";

// Total de slides = 1 (o HeroReel, slide 0) + 1 (o HookReel, slide 1,
// o "gancho" de impacto) + uma notícia por item de content/noticias.ts.
// A partir daqui, toda notícia mora no índice `i + 2` (não mais
// `i + 1`) — é por isso que esse "+2" aparece de novo mais abaixo, no
// map das notícias.
const TOTAL_DE_SLIDES = noticias.length + 2;

// Threshold (limiar) do IntersectionObserver: 0.6 = um slide só é
// considerado "ativo" quando pelo menos 60% dele está visível dentro
// do contêiner. Evita que dois slides fiquem "brigando" pelo status
// de ativo durante a transição rápida de um pro outro.
const LIMIAR_ATIVO = 0.6;

export default function ReelsFeed() {
  // Índice do slide atualmente visível (0 = HeroReel, 1 = HookReel,
  // 2..N+1 = notícias na mesma ordem de content/noticias.ts). Usado
  // pra: bloco de telemetria (FEED/ALT/SINAL), trilho de altitude,
  // dica de scroll no slide 0 e pra saber pra onde as setas do
  // teclado devem levar.
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  // Referência do próprio contêiner rolável — vira o `root` do
  // IntersectionObserver (sem isso, o observer mediria a visibilidade
  // em relação à janela inteira do navegador, não ao nosso feed).
  const containerRef = useRef<HTMLDivElement>(null);

  // Uma referência de DOM por slide (índice 0 = HeroReel, 1 =
  // HookReel, 2..N+1 = notícias), preenchida via "callback ref" em
  // cada `<div>` abaixo. É por aqui que tanto o IntersectionObserver
  // quanto os cliques no trilho de altitude/teclado sabem pra qual
  // elemento chamar `scrollIntoView`.
  const slideRefs = useRef<(HTMLDivElement | null)[]>(
    Array(TOTAL_DE_SLIDES).fill(null)
  );

  // Guardamos a preferência de "reduzir movimento" numa ref (não
  // precisa de re-render quando isso muda) pra decidir se o
  // `scrollIntoView` programático usa animação suave ou pulo direto.
  const reduzMovimentoRef = useRef(false);

  useEffect(() => {
    reduzMovimentoRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  // ------------------------------------------------------------
  // Detecção do slide ativo via IntersectionObserver.
  // ------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            const indice = Number(
              entrada.target.getAttribute("data-indice")
            );
            if (!Number.isNaN(indice)) setIndiceAtivo(indice);
          }
        }
      },
      { root: container, threshold: LIMIAR_ATIVO }
    );

    for (const elemento of slideRefs.current) {
      if (elemento) observer.observe(elemento);
    }

    return () => observer.disconnect();
  }, []);

  // Leva o feed até o slide pedido, rolando suavemente (ou "pulando"
  // direto, se a pessoa pediu "reduzir movimento" no sistema).
  function irParaSlide(indice: number) {
    const alvo = slideRefs.current[indice];
    if (!alvo) return;
    alvo.scrollIntoView({
      behavior: reduzMovimentoRef.current ? "auto" : "smooth",
      block: "start",
    });
  }

  // ------------------------------------------------------------
  // Navegação por teclado: o contêiner com scroll não recebe foco de
  // teclado por padrão (e dar `tabIndex` a ele não faria as SETAS
  // funcionarem sozinhas) — então escutamos as teclas na `window`
  // inteira e decidimos pra qual slide ir a partir do slide ativo
  // atual.
  // ------------------------------------------------------------
  useEffect(() => {
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "ArrowDown" || evento.key === "PageDown") {
        evento.preventDefault();
        irParaSlide(Math.min(indiceAtivo + 1, TOTAL_DE_SLIDES - 1));
      } else if (evento.key === "ArrowUp" || evento.key === "PageUp") {
        evento.preventDefault();
        irParaSlide(Math.max(indiceAtivo - 1, 0));
      }
      // Barra de espaço: deixamos quieta de propósito (comportamento
      // padrão do navegador — normalmente rola uma tela — já se
      // encaixa bem aqui, não precisa de tratamento especial).
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [indiceAtivo]);

  const numeroExibido = String(indiceAtivo + 1).padStart(2, "0");
  const totalExibido = String(TOTAL_DE_SLIDES).padStart(2, "0");

  // "Altitude" fictícia do bloco de telemetria: sobe 34 km a cada
  // slide navegado, sempre com 3 dígitos (+000, +034, +068...). É só
  // decoração — não existe um foguete de verdade subindo — mas
  // materializa a ideia do roadmap de que rolar o feed é "subir" cada
  // vez mais alto.
  const altitudeExibida = String(indiceAtivo * 34).padStart(3, "0");

  return (
    <div
      ref={containerRef}
      role="feed"
      aria-label="Feed de notícias"
      // z-[1]: acima do StarField (z-0, o fundo de estrelas) e abaixo
      // dos overlays fixos do site (CountdownIntro, GrainOverlay).
      // bg-transparent: deixa o StarField continuar visível nas
      // bordas/gradientes de cada slide.
      className="fixed inset-0 z-[1] h-dvh w-full snap-y snap-mandatory overflow-y-auto overscroll-contain bg-transparent"
    >
      {/* Slide 0: a ignição do foguete, tocando por tempo. */}
      <div
        ref={(elemento) => {
          slideRefs.current[0] = elemento;
        }}
        data-indice={0}
        data-ativo={indiceAtivo === 0 ? "true" : "false"}
        role="article"
        aria-roledescription="slide"
        aria-label="Abertura: Notícias das Estrelas"
        aria-posinset={1}
        aria-setsize={TOTAL_DE_SLIDES}
        className="relative h-dvh w-full snap-start snap-always"
      >
        <HeroReel />

        {/* Dica de rolagem: só aparece no slide 0, some assim que a
            pessoa navega pra qualquer outro slide. `motion-safe:` faz
            o Tailwind aplicar `animate-bounce` só pra quem NÃO pediu
            "reduzir movimento" (o texto continua visível pra todo
            mundo, só o balanço para). */}
        {indiceAtivo === 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 motion-safe:animate-bounce sm:bottom-8"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-dim)]"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
            <span className="font-telemetry text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
              role para explorar
            </span>
          </div>
        )}
      </div>

      {/* Slide 1: o HookReel, o "gancho" de impacto pós-ignição —
          sem foto, só tipografia flutuando sobre o StarField. */}
      <div
        ref={(elemento) => {
          slideRefs.current[1] = elemento;
        }}
        data-indice={1}
        data-ativo={indiceAtivo === 1 ? "true" : "false"}
        role="article"
        aria-roledescription="slide"
        aria-label="Seu cérebro merece um scroll melhor"
        aria-posinset={2}
        aria-setsize={TOTAL_DE_SLIDES}
        className="relative h-dvh w-full snap-start snap-always"
      >
        <HookReel />
      </div>

      {/* Um slide por notícia — mesma ordem de content/noticias.ts.
          +2 porque agora os dois primeiros slides são HeroReel (0) e
          HookReel (1). */}
      {noticias.map((noticia, i) => {
        const indice = i + 2;
        return (
          <div
            key={noticia.slug}
            ref={(elemento) => {
              slideRefs.current[indice] = elemento;
            }}
            data-indice={indice}
            data-ativo={indiceAtivo === indice ? "true" : "false"}
            role="article"
            aria-roledescription="slide"
            aria-label={noticia.manchete}
            aria-posinset={indice + 1}
            aria-setsize={TOTAL_DE_SLIDES}
            className="relative h-dvh w-full snap-start snap-always"
          >
            {/* As duas primeiras notícias carregam a imagem com
                prioridade (aparecem cedo na navegação). numero=i+1
                dá o "01, 02, 03..." do número fantasma — a posição da
                notícia dentro da lista, não o índice do slide. */}
            <NewsReel noticia={noticia} numero={i + 1} prioridade={i < 2} />
          </div>
        );
      })}

      {/* Moldura HUD fixa: 4 cantoneiras em "L" nos cantos da tela,
          como a moldura de um visor de instrumento — não é uma caixa
          fechada, só um lembrete discreto de que isso é um painel, não
          uma página comum. `pointer-events-none` em tudo (o contêiner
          e cada cantoneira) garante que elas nunca atrapalham cliques
          em nada por baixo. O `max(...)` no posicionamento soma a
          margem fixa de 14px com o "recuo de área segura" do celular
          (`env(safe-area-inset-*)`, usado em telas com notch/barra de
          gestos) — fica sempre pelo menos 14px longe da borda física
          da tela, nunca menos. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]">
        <div
          className="absolute h-3 w-3 border-t border-l border-white/15 sm:h-5 sm:w-5"
          style={{
            top: "max(14px, env(safe-area-inset-top))",
            left: "max(14px, env(safe-area-inset-left))",
          }}
        />
        <div
          className="absolute h-3 w-3 border-t border-r border-white/15 sm:h-5 sm:w-5"
          style={{
            top: "max(14px, env(safe-area-inset-top))",
            right: "max(14px, env(safe-area-inset-right))",
          }}
        />
        <div
          className="absolute h-3 w-3 border-b border-l border-white/15 sm:h-5 sm:w-5"
          style={{
            bottom: "max(14px, env(safe-area-inset-bottom))",
            left: "max(14px, env(safe-area-inset-left))",
          }}
        />
        <div
          className="absolute h-3 w-3 border-r border-b border-white/15 sm:h-5 sm:w-5"
          style={{
            bottom: "max(14px, env(safe-area-inset-bottom))",
            right: "max(14px, env(safe-area-inset-right))",
          }}
        />
      </div>

      {/* Bloco de telemetria fixo, canto inferior direito — evolução
          do antigo contador "NN / total": agora parece um instrumento
          de painel de verdade, com três leituras alinhadas à direita
          (rótulo em branco bem apagado, valor na cor de texto
          padrão). Não faz parte do fluxo de scroll — fica sempre no
          mesmo lugar da TELA, por isso é filho direto do contêiner
          com posição fixa. */}
      <div
        aria-hidden="true"
        className="font-telemetry pointer-events-none fixed right-4 bottom-4 z-[2] flex flex-col items-end gap-1 text-right text-[10px] tracking-[0.2em] uppercase sm:right-6 sm:bottom-6 sm:text-[11px]"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-white/40">Feed</span>
          <span className="tabular-nums text-[var(--text-dim)]">
            {numeroExibido} / {totalExibido}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-white/40">Alt</span>
          <span className="tabular-nums text-[var(--text-dim)]">
            +{altitudeExibida} km
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Sinal</span>
          <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
            <span className="pulso-sinal inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Ativo
          </span>
        </div>
      </div>

      {/* Trilho de altitude — substitui as antigas bolinhas de
          navegação, só em telas médias pra cima (em celular o gesto
          de swipe já resolve a navegação, e o trilho ocuparia espaço
          precioso). É uma linha vertical fina com uma marca (tick) por
          slide: a marca do slide ativo fica maior, na cor de destaque,
          com um leve brilho, e ganha um rótulo numérico do lado — a
          mesma lógica visual de uma régua de altímetro. */}
      <nav
        aria-label="Navegação do feed"
        className="fixed top-1/2 right-4 z-[2] hidden h-[40vh] -translate-y-1/2 md:block sm:right-6"
      >
        {/* A linha vertical fica atrás dos ticks, ocupando a altura
            inteira do trilho — os `<button>`s por cima são
            distribuídos com `justify-between` e vão "pousar" ao longo
            dela. */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-[3px] bottom-0 w-px bg-white/15"
        />
        <div className="relative flex h-full flex-col items-end justify-between">
          {Array.from({ length: TOTAL_DE_SLIDES }, (_, indice) => {
            const ativo = indiceAtivo === indice;
            let rotulo: string;
            if (indice === 0) {
              rotulo = "Ir para a abertura: Notícias das Estrelas";
            } else if (indice === 1) {
              rotulo = "Ir para o gancho: Seu cérebro merece um scroll melhor";
            } else {
              rotulo = `Ir para notícia ${indice - 1} de ${noticias.length}: ${noticias[indice - 2].manchete}`;
            }
            return (
              <button
                key={indice}
                type="button"
                onClick={() => irParaSlide(indice)}
                aria-label={rotulo}
                aria-current={ativo ? "true" : undefined}
                className="group flex items-center gap-2 py-2"
              >
                {/* Rótulo mono com o número do slide — só aparece ao
                    lado da marca ativa, igual a etiqueta de um
                    instrumento apontando pra leitura atual. */}
                <span
                  aria-hidden="true"
                  className={`font-telemetry text-[10px] tabular-nums text-[var(--accent)] transition-opacity duration-300 ${
                    ativo ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className={`block h-px transition-all duration-300 ${
                    ativo
                      ? "w-[18px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
                      : "w-[10px] bg-white/30 group-hover:bg-white/50"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
