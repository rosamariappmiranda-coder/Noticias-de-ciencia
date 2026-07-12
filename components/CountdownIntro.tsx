"use client";

/**
 * CountdownIntro
 * ---------------------------------------------------------------
 * Tela cheia de contagem regressiva (T-3, T-2, T-1) que aparece
 * antes de tudo, estilo "painel de controle de lançamento". Depois
 * que termina, o overlay some com um fade suave e o componente sai
 * completamente do DOM (deixa de existir — não fica só invisível
 * escondido atrás dos outros elementos).
 * ---------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CountdownIntro() {
  // O número muda só 3 vezes em ~3 segundos — frequência baixíssima,
  // então useState está OK aqui. (A regra de "usar ref" do projeto é
  // pra valores que mudam a cada quadro de animação, tipo o
  // progresso do scroll em HeroScene — não é o caso deste contador.)
  const [contagem, setContagem] = useState(3);
  const [visivel, setVisivel] = useState(true);

  const overlayRef = useRef<HTMLDivElement>(null);
  const numeroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const numero = numeroRef.current;
    if (!overlay || !numero) return;

    // Quem pediu "reduzir movimento" no sistema não deve ver o
    // número "pulsando" (crescendo e voltando ao tamanho normal) —
    // só uma troca simples de opacidade a cada segundo.
    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const tl = gsap.timeline({
      onComplete: () => {
        // Ao terminar a contagem, o overlay inteiro se dissolve...
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.6,
          ease: "power1.out",
          // ...e só então o componente sai do DOM de verdade.
          onComplete: () => setVisivel(false),
        });
      },
    });

    ([3, 2, 1] as const).forEach((valor, indice) => {
      const instante = indice; // 0s, 1s, 2s — um número por segundo

      // Troca o número exibido no instante certo da timeline.
      tl.call(() => setContagem(valor), undefined, instante);

      if (reduzMovimento) {
        tl.fromTo(
          numero,
          { opacity: 0.3 },
          { opacity: 1, duration: 0.25, ease: "power1.out" },
          instante
        );
      } else {
        // Pulso: o número "bate" (cresce e encolhe de volta), como
        // um sinal de telemetria pulsando a cada segundo.
        tl.fromTo(
          numero,
          { scale: 1.15, opacity: 0.4 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" },
          instante
        );
      }
    });

    // Prende a timeline em exatamente 3s (mantém o "T-1" visível até
    // lá) antes de disparar o onComplete que inicia o fade-out.
    tl.to({}, { duration: 0.001 }, 3);

    return () => {
      tl.kill();
    };
  }, []);

  // Removido do DOM de verdade — não é só CSS escondendo.
  if (!visivel) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]"
    >
      {/* Linhas finas no topo e na base — moldura de painel de HUD
          ("heads-up display", os painéis de dados sobrepostos que
          pilotos e naves usam). */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      {/* Textos de telemetria decorativos, tipo painel de lançamento real —
          fonte "telemetria" (--font-mono) e cor de texto apagado do projeto. */}
      <div className="font-telemetry absolute left-4 top-4 text-[10px] uppercase tracking-[0.25em] text-[var(--text-dim)] sm:left-8 sm:top-8 sm:text-xs">
        sistema · lançamento
      </div>
      <div className="font-telemetry absolute right-4 top-4 text-[10px] uppercase tracking-[0.25em] text-[var(--text-dim)] sm:right-8 sm:top-8 sm:text-xs">
        28.5721°N 80.6480°W
      </div>
      <div className="font-telemetry absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)] sm:bottom-8 sm:text-xs">
        iniciando transmissão
      </div>

      {/* "Mira" com cantos, como um reticle de câmera de rastreio de
          lançamento, emoldurando o número central. */}
      <div className="relative flex h-[46vh] w-[70vw] max-w-[420px] items-center justify-center sm:h-[380px]">
        <span className="absolute left-0 top-0 h-8 w-8 border-l border-t border-white/30 sm:h-10 sm:w-10" />
        <span className="absolute right-0 top-0 h-8 w-8 border-r border-t border-white/30 sm:h-10 sm:w-10" />
        <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-white/30 sm:h-10 sm:w-10" />
        <span className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-white/30 sm:h-10 sm:w-10" />

        <div
          ref={numeroRef}
          className="font-display bg-gradient-to-b from-[var(--text)] to-[var(--accent)] bg-clip-text text-[22vw] font-black leading-none tracking-tighter text-transparent sm:text-[10rem]"
        >
          T-{contagem}
        </div>
      </div>
    </div>
  );
}
