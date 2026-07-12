"use client";

/**
 * CountdownIntro
 * ---------------------------------------------------------------
 * Contagem regressiva DISCRETA no canto superior esquerdo da tela
 * (antes era uma tela cheia que bloqueava tudo por 3 segundos —
 * a Rosa pediu algo sutil, que deixe a pessoa ver o foguete e
 * scrollar desde o primeiro instante).
 *
 * Comportamento: um pequeno painel de telemetria conta de T-10 até
 * T-0, um segundo por vez, com um pontinho pulsando ao lado (como a
 * luz de "gravando" de uma câmera). Ao chegar em zero, o texto vira
 * "ignição autorizada" e o painel inteiro se dissolve e sai do DOM.
 *
 * FUTURO (áudio do centro de comando): quando a Rosa mandar o
 * arquivo de áudio da contagem do controle de missão, ele deve
 * começar a tocar no mesmo instante em que este componente monta —
 * procurar o comentário "PONTO DE ENTRADA DO ÁUDIO" abaixo.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// De quantos segundos a contagem parte. 10 segundos = o clássico
// "T minus 10" dos lançamentos reais (e o tamanho típico dos áudios
// de contagem do centro de comando, o que vai facilitar sincronizar
// o som depois).
const SEGUNDOS_INICIAIS = 10;

// Quanto tempo (em ms) a mensagem final "ignição autorizada" fica
// visível antes do painel se dissolver.
const PAUSA_FINAL_MS = 1600;

export default function CountdownIntro() {
  // O número muda 1 vez por segundo — frequência baixíssima, então
  // useState está OK aqui (a regra de "usar ref" do projeto é pra
  // valores que mudam a cada quadro de animação, tipo o progresso do
  // scroll em LaunchFrames — não é o caso deste contador).
  const [segundos, setSegundos] = useState(SEGUNDOS_INICIAIS);
  const [visivel, setVisivel] = useState(true);

  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const painel = painelRef.current;
    if (!painel) return;

    // PONTO DE ENTRADA DO ÁUDIO ---------------------------------
    // Quando o arquivo chegar: criar aqui um `new Audio("/caminho")`
    // e dar .play() — navegadores podem bloquear som automático sem
    // interação da pessoa, então vamos tratar isso juntos na hora.
    // ------------------------------------------------------------

    // Tique de 1 em 1 segundo: desconta até chegar em 0 e então
    // para o relógio (o efeito de saída é disparado pelo outro
    // useEffect, que observa o valor chegar em 0).
    const relogio = window.setInterval(() => {
      setSegundos((valorAtual) => {
        if (valorAtual <= 1) {
          window.clearInterval(relogio);
          return 0;
        }
        return valorAtual - 1;
      });
    }, 1000);

    return () => window.clearInterval(relogio);
  }, []);

  // Efeito de saída: quando a contagem zera, espera a pausa final
  // (com "ignição autorizada" na tela) e dissolve o painel.
  useEffect(() => {
    if (segundos !== 0) return;
    const painel = painelRef.current;
    if (!painel) return;

    const saida = window.setTimeout(() => {
      gsap.to(painel, {
        opacity: 0,
        duration: 0.8,
        ease: "power1.out",
        // Só depois do fade o componente sai do DOM de verdade
        // (deixa de existir — não fica invisível ocupando espaço).
        onComplete: () => setVisivel(false),
      });
    }, PAUSA_FINAL_MS);

    return () => window.clearTimeout(saida);
  }, [segundos]);

  if (!visivel) return null;

  const contagemZerou = segundos === 0;

  return (
    <div
      ref={painelRef}
      aria-hidden="true"
      // pointer-events-none: o painel é só decorativo — cliques e
      // scroll "atravessam" ele e chegam na página normalmente.
      // Fica um pouco abaixo do bracket de HUD do hero (que ocupa o
      // cantinho extremo) pra não brigar com ele.
      className="pointer-events-none fixed left-5 top-16 z-40 sm:left-10 sm:top-20"
    >
      <div className="flex items-center gap-2.5">
        {/* Pontinho de status: âmbar pulsando durante a contagem
            (cor exclusiva do fogo/motor no nosso design), e fica
            aceso fixo quando a ignição é autorizada. O pulso usa a
            classe animate-pulse do Tailwind — que o navegador já
            desliga sozinho pra quem pediu "reduzir movimento". */}
        <span
          className={`h-1.5 w-1.5 rounded-full bg-[var(--exhaust)] ${
            contagemZerou ? "" : "motion-safe:animate-pulse"
          }`}
        />
        <span className="font-telemetry text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)] sm:text-xs">
          {contagemZerou ? (
            "ignição autorizada"
          ) : (
            <>
              T-
              <span className="text-[var(--text)]">
                {String(segundos).padStart(2, "0")}
              </span>
              s
            </>
          )}
        </span>
      </div>

      {/* Linha fina de "trilho" embaixo do texto, que encolhe junto
          com a contagem — um progresso silencioso, sem números
          gigantes na tela. */}
      <div className="mt-2 h-px w-full bg-white/10">
        <div
          className="h-px bg-[var(--exhaust)]/70 transition-all duration-1000 ease-linear"
          style={{ width: `${(segundos / SEGUNDOS_INICIAIS) * 100}%` }}
        />
      </div>
    </div>
  );
}
