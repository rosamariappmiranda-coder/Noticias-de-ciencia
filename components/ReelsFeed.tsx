"use client";

/**
 * ReelsFeed
 * ---------------------------------------------------------------
 * O CONTÊINER do novo feed estilo TikTok/Reels: a partir de agora,
 * é ESTE elemento que rola — não mais o `<body>` da página (ver
 * `overflow: hidden` adicionado em app/globals.css). Dentro dele
 * moram, em sequência vertical: o slide 0 (`HeroReel`, a ignição do
 * foguete) e depois um slide por notícia (`NewsReel`).
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
import NewsReel from "@/components/NewsReel";

// Total de slides = 1 (o HeroReel, slide 0) + uma notícia por item de
// content/noticias.ts.
const TOTAL_DE_SLIDES = noticias.length + 1;

// Threshold (limiar) do IntersectionObserver: 0.6 = um slide só é
// considerado "ativo" quando pelo menos 60% dele está visível dentro
// do contêiner. Evita que dois slides fiquem "brigando" pelo status
// de ativo durante a transição rápida de um pro outro.
const LIMIAR_ATIVO = 0.6;

export default function ReelsFeed() {
  // Índice do slide atualmente visível (0 = HeroReel, 1..N = notícias
  // na mesma ordem de content/noticias.ts). Usado pra: contador
  // "NN / total", bolinhas de navegação, dica de scroll no slide 0 e
  // pra saber pra onde as setas do teclado devem levar.
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  // Referência do próprio contêiner rolável — vira o `root` do
  // IntersectionObserver (sem isso, o observer mediria a visibilidade
  // em relação à janela inteira do navegador, não ao nosso feed).
  const containerRef = useRef<HTMLDivElement>(null);

  // Uma referência de DOM por slide (índice 0 = HeroReel, 1..N =
  // notícias), preenchida via "callback ref" em cada `<div>` abaixo.
  // É por aqui que tanto o IntersectionObserver quanto os cliques nas
  // bolinhas/teclado sabem pra qual elemento chamar `scrollIntoView`.
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

      {/* Um slide por notícia — mesma ordem de content/noticias.ts. */}
      {noticias.map((noticia, i) => {
        const indice = i + 1; // +1 porque o slide 0 é o HeroReel
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
                prioridade (aparecem cedo na navegação). */}
            <NewsReel noticia={noticia} prioridade={i < 2} />
          </div>
        );
      })}

      {/* Contador fixo "NN / total" — não faz parte do fluxo de
          scroll (fica sempre no mesmo lugar da TELA, não do slide),
          por isso é um filho direto do contêiner com posição fixa. */}
      <div
        aria-hidden="true"
        className="font-telemetry pointer-events-none fixed right-4 bottom-4 z-[2] text-xs tracking-[0.2em] tabular-nums text-[var(--text-dim)] sm:right-6 sm:bottom-6"
      >
        {numeroExibido} / {totalExibido}
      </div>

      {/* Bolinhas de navegação lateral — só em telas médias pra cima
          (em celular elas ocupariam espaço precioso e o gesto de
          swipe já resolve a navegação). */}
      <div className="fixed top-1/2 right-4 z-[2] hidden -translate-y-1/2 flex-col gap-3 md:flex sm:right-6">
        {Array.from({ length: TOTAL_DE_SLIDES }, (_, indice) => {
          const ativo = indiceAtivo === indice;
          const rotulo =
            indice === 0
              ? "Ir para a abertura: Notícias das Estrelas"
              : `Ir para notícia ${indice} de ${noticias.length}: ${noticias[indice - 1].manchete}`;
          return (
            <button
              key={indice}
              type="button"
              onClick={() => irParaSlide(indice)}
              aria-label={rotulo}
              aria-current={ativo ? "true" : undefined}
              className={`rounded-full border border-white/30 transition-all duration-300 ${
                ativo
                  ? "h-2.5 w-2.5 border-[var(--accent)] bg-[var(--accent)]"
                  : "h-2 w-2 bg-transparent hover:bg-white/30"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
