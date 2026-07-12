"use client";

/**
 * NewsFeed
 * ---------------------------------------------------------------
 * Orquestra o feed de notícias: renderiza um NewsCard pra cada
 * notícia (vindas de content/noticias.ts) e anima a ENTRADA de cada
 * card conforme ele vai aparecendo na tela durante o scroll — o
 * "scrollytelling" do feed.
 *
 * Mesma filosofia de LaunchFrames: cada card ganha um ScrollTrigger
 * próprio, disparado quando o topo do card cruza 85% da altura da
 * tela (ou seja, ele já anima um pouco antes de chegar bem no meio
 * da tela — fica mais natural do que esperar centralizar).
 *
 * Diferente de LaunchFrames, aqui NÃO tem pin (nada fica "preso" na
 * tela) — é scroll livre e contínuo, como um feed de rede social,
 * só que com uma entrada lateral elegante em vez de aparecer sem
 * graça.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NewsCard from "./NewsCard";
import { noticias } from "@/content/noticias";

gsap.registerPlugin(ScrollTrigger);

// Mesmo ponto de corte usado em LaunchFrames pra decidir o que é
// "tela estreita" (mobile) — mantemos os dois arquivos consistentes
// entre si, é o mesmo breakpoint em espírito do resto do site.
const LARGURA_TELA_ESTREITA = 768;

// Deslocamento horizontal (em pixels) que os cards de desktop
// percorrem ao entrar — cards de índice par vêm da esquerda, ímpar
// da direita.
const DESLOCAMENTO_DESKTOP_PX = 80;

// Deslocamento vertical (em pixels) da entrada no mobile — sem
// deslocamento lateral, só um leve "subir" acompanhado de fade.
const DESLOCAMENTO_MOBILE_PX = 40;

// Rotação leve (em graus) que os cards de desktop têm ANTES de
// entrar, e que zera conforme eles chegam — dá uma sensação de
// "assentar" no lugar, em vez de deslizar reto feito régua.
const ROTACAO_INICIAL_GRAUS = 1.5;

export default function NewsFeed() {
  // Um "slot" de referência por card, na mesma ordem do array de
  // notícias — cada NewsCard avisa aqui, via a prop cardRef, qual é
  // o elemento <a> dele de verdade no DOM.
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const ehDesktop = window.innerWidth >= LARGURA_TELA_ESTREITA;

    // Guardamos os tweens criados aqui pra poder desligar tanto o
    // ScrollTrigger quanto a animação em si quando o componente sair
    // de tela (evita "vazamento" de triggers escutando scroll depois
    // que o feed nem existe mais no DOM).
    const tweensCriados: gsap.core.Tween[] = [];

    cardsRef.current.forEach((card, indice) => {
      if (!card) return;

      // De onde o card "vem" (estado inicial, invisível) até onde
      // ele "chega" (estado final, visível e no lugar) — muda
      // conforme o dispositivo e a preferência de movimento.
      let de: gsap.TweenVars;
      let para: gsap.TweenVars;

      if (reduzMovimento) {
        // Acessibilidade: quem pediu "reduzir movimento" só vê um
        // fade simples, sem NENHUM deslocamento ou rotação — mesmo
        // padrão já usado em LaunchFrames.
        de = { opacity: 0 };
        para = { opacity: 1, duration: 0.6, ease: "power1.out" };
      } else if (ehDesktop) {
        // Desktop: cards alternam o lado de entrada (par = esquerda,
        // ímpar = direita), com uma leve rotação que zera ao chegar.
        const vemDaEsquerda = indice % 2 === 0;
        de = {
          opacity: 0,
          x: vemDaEsquerda ? -DESLOCAMENTO_DESKTOP_PX : DESLOCAMENTO_DESKTOP_PX,
          rotate: vemDaEsquerda ? -ROTACAO_INICIAL_GRAUS : ROTACAO_INICIAL_GRAUS,
        };
        para = {
          opacity: 1,
          x: 0,
          rotate: 0,
          duration: 0.9,
          ease: "power3.out",
        };
      } else {
        // Mobile: só sobe um pouco enquanto some o fade — deslocar
        // pros lados numa tela estreita cortaria o card e ficaria
        // estranho.
        de = { opacity: 0, y: DESLOCAMENTO_MOBILE_PX };
        para = { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" };
      }

      const tween = gsap.fromTo(card, de, {
        ...para,
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          // "play none none reverse": ao entrar na área de gatilho,
          // toca a animação; se a pessoa rolar de volta pra cima e
          // sair da área, desfaz (o card volta a ficar invisível) —
          // assim, se ela rolar pra baixo de novo, vê a entrada outra
          // vez, em vez de um card "gasto" que já apareceu.
          toggleActions: "play none none reverse",
        },
      });

      tweensCriados.push(tween);
    });

    return () => {
      tweensCriados.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
  }, []);

  return (
    <section className="relative bg-[var(--surface)] px-6 py-24 sm:py-32">
      <div className="mx-auto flex max-w-2xl flex-col gap-24 sm:gap-32">
        {noticias.map((noticia, indice) => (
          <div
            key={noticia.slug}
            // Alinhamento alternado sutil no desktop: cards pares
            // encostam mais à esquerda do corredor central, ímpares
            // mais à direita — reforça a sensação de "entrada lateral"
            // mesmo depois que a animação termina.
            className={
              indice % 2 === 0
                ? "md:mr-[6%] md:w-[92%]"
                : "md:ml-[6%] md:w-[92%]"
            }
          >
            <NewsCard
              noticia={noticia}
              cardRef={(elemento) => {
                cardsRef.current[indice] = elemento;
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
