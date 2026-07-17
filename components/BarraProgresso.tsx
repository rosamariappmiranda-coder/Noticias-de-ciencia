"use client";

/**
 * BarraProgresso
 * ---------------------------------------------------------------
 * Linha fininha no topo da tela que "enche" conforme a pessoa rola a
 * página. Neuromarketing básico: barra de progresso ativa o instinto
 * de completar (ninguém gosta de deixar barra pela metade) — e ainda
 * dá noção de "quanto falta", o que reduz a chance de abandono.
 *
 * Padrão de sempre: nada de useState pro scroll (dispara dezenas de
 * vezes por segundo) — atualizamos o style direto via ref + rAF.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";

export default function BarraProgresso() {
  const barraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const barra = barraRef.current;
    if (!barra) return;

    let agendado = false;

    function atualizar() {
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      const progresso = total > 0 ? window.scrollY / total : 0;
      barra!.style.transform = `scaleX(${Math.min(1, Math.max(0, progresso))})`;
    }

    function aoRolar() {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        atualizar();
        agendado = false;
      });
    }

    atualizar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]"
    >
      <div
        ref={barraRef}
        className="h-full w-full origin-left"
        style={{
          transform: "scaleX(0)",
          background:
            "linear-gradient(90deg, var(--accent), #c79bff 60%, #ffb56b)",
          boxShadow: "0 0 12px rgba(91,140,255,0.7)",
        }}
      />
    </div>
  );
}
