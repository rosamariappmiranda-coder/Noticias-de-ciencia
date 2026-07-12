"use client";

/**
 * SmoothScrollProvider
 * ---------------------------------------------------------------
 * Liga o Lenis (rolagem suave/"amortecida") ao GSAP ScrollTrigger
 * (o "sensor" de rolagem que dirige as animações presas na tela).
 *
 * "use client" = este componente roda no NAVEGADOR, não no servidor.
 * É obrigatório aqui porque Lenis e GSAP dependem de `window` e do
 * DOM, que não existem durante a renderização no servidor do Next.js.
 * ---------------------------------------------------------------
 */

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Acessibilidade: quem ativou "reduzir movimento" no sistema
    // operacional mantém a rolagem padrão do navegador — sem
    // suavização artificial, que pode incomodar quem tem enjoo
    // de movimento (vestibular).
    const prefereReduzirMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefereReduzirMovimento) return;

    const lenis = new Lenis({
      duration: 1.2, // quanto tempo (segundos) leva para "alcançar" o destino do scroll
      smoothWheel: true,
    });

    // Lenis roda seu próprio relógio de animação. Aqui o plugamos
    // no "ticker" do GSAP para os dois ficarem no mesmo quadro —
    // é a integração recomendada pela documentação oficial do Lenis.
    function sincronizarRelogio(tempoEmSegundos: number) {
      lenis.raf(tempoEmSegundos * 1000);
    }
    gsap.ticker.add(sincronizarRelogio);
    gsap.ticker.lagSmoothing(0); // evita "pulos" após a aba ficar em segundo plano

    // Sempre que o Lenis rolar, o ScrollTrigger recalcula na hora
    // (senão as seções "pinadas" ficariam levemente atrasadas).
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(sincronizarRelogio);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
