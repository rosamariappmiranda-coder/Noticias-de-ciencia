"use client";

/**
 * PortalIntro
 * ---------------------------------------------------------------
 * Seção de "ancoragem": vem logo depois do hero (LaunchFrames) e
 * apresenta o portal em poucas frases, antes do feed de notícias
 * começar de verdade. É a ponte entre o impacto visual do hero e o
 * conteúdo — explica RAPIDAMENTE o que a pessoa está prestes a ler.
 *
 * A frase-gancho ("Seu feed de conhecimento") já apareceu no fim do
 * hero — aqui a gente não repete ela, e sim aprofunda o que ela quer
 * dizer, em 2-3 frases diretas.
 *
 * Animação: um fade + leve "subida" (rise) disparado uma única vez
 * quando a seção entra na tela, via GSAP ScrollTrigger — muito mais
 * sutil que o scrollytelling do feed logo abaixo (aqui é só uma
 * transição de entrada, não uma sequência dirigida pelo scroll).
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PortalIntro() {
  const secaoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const secao = secaoRef.current;
    if (!secao) return;

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Quem pediu "reduzir movimento" só vê um fade puro, sem
    // deslocamento nenhum — mesmo padrão de acessibilidade usado em
    // LaunchFrames e NewsFeed.
    const tween = gsap.fromTo(
      secao,
      { opacity: 0, y: reduzMovimento ? 0 : 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: secao,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      ref={secaoRef}
      className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:py-36"
    >
      <p className="font-display text-3xl font-semibold leading-snug text-[var(--text)] sm:text-4xl md:text-5xl">
        Ciência, espaço e tecnologia — direto da fonte, sem enrolação.
      </p>
      <p className="mt-6 text-base leading-relaxed text-[var(--text-dim)] sm:text-lg">
        Cada notícia aqui é verificada em múltiplas fontes antes de virar
        matéria: nada de clickbait, nada de manchete que promete mais do
        que a descoberta realmente entrega. É o feed de quem quer entender
        o universo — não só rolar por ele.
      </p>
    </section>
  );
}
