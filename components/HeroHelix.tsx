"use client";

/**
 * HeroHelix
 * ---------------------------------------------------------------
 * Hero no estilo helixearth.com: uma SEQUÊNCIA DE FOTOGRAMAS (123
 * quadros WebP da ignição do foguete) desenhada num <canvas> e
 * dirigida pelo scroll — e, no fim da rolagem, o foguete se DISSOLVE
 * (some com opacidade + leve zoom) revelando o céu de estrelas com o
 * título surgindo por baixo.
 *
 * Este componente nasce do LaunchFrames.tsx (que já fazia o canvas +
 * o "arrastar o vídeo pelo scroll" + o pré-carregamento em lotes) e
 * acrescenta a peça que faltava no projeto: a DISSOLUÇÃO ("melt").
 *
 * Como o efeito é dividido em duas fases dentro da mesma rolagem presa:
 *
 *   progresso 0.00 → 0.85  → o foguete "toca": troca de fotograma
 *                            conforme a pessoa rola (0 até o último).
 *   progresso 0.85 → 1.00  → o foguete já está no quadro final e
 *                            começa a SUMIR: o <canvas> anima
 *                            opacidade 1→0 e escala 1→1.08 (um leve
 *                            afastamento "pra dentro do céu"), enquanto
 *                            o bloco de título aparece (opacidade 0→1).
 *
 * O StarField fica FIXO atrás de tudo (z-0), então não precisamos
 * "desenhar" a transição: quando o canvas se apaga, o céu que já
 * estava atrás simplesmente aparece.
 *
 * Assim como em LaunchFrames, o progresso do scroll NUNCA vira
 * useState (mudaria dezenas de vezes por segundo — re-renderizar o
 * React nesse ritmo seria lento). Tudo fica em refs e o que muda na
 * tela é atualizado direto via .style dentro do onUpdate do
 * ScrollTrigger.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --------------------------------------------------------------
// Configuração dos fotogramas
// --------------------------------------------------------------

// Quantidade total de fotos em public/rocket-frames/ (frame-0001.webp
// até frame-0123.webp — quadros extraídos do vídeo de ignição).
const TOTAL_DE_FRAMES = 123;

// Em que ponto do progresso (0 a 1) o foguete termina de "tocar" e
// começa a dissolução. Até aqui, o scroll troca fotogramas; a partir
// daqui, o foguete fica no último quadro e vai sumindo.
const FIM_DO_VOO = 0.85;

// Índice (base 0) do frame usado como "pôster": a primeira imagem
// mostrada, antes de qualquer scroll.
const INDICE_DO_POSTER = 0;

// Quantas imagens carregamos em paralelo por "lote" durante o
// pré-carregamento em segundo plano.
const TAMANHO_DO_LOTE = 12;

// Nunca desenhar em mais que o dobro da densidade de pixels "normal"
// — evita canvases gigantes em telas com devicePixelRatio muito alto.
const DPR_MAXIMO = 2;

// Escala máxima do canvas no auge da dissolução (1.08 = 8% maior).
const ESCALA_NA_DISSOLUCAO = 1.08;

// Monta o caminho do arquivo a partir do índice (base 0). Ex.:
// caminhoDoFrame(0) → "/rocket-frames/frame-0001.webp"
function caminhoDoFrame(indice: number): string {
  const numeroDoArquivo = String(indice + 1).padStart(4, "0");
  return `/rocket-frames/frame-${numeroDoArquivo}.webp`;
}

// --------------------------------------------------------------
// Funções pequenas de matemática
// --------------------------------------------------------------

function limitar(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

// Remapeia `valor` da faixa [inicio, fim] para [0, 1], limitando as
// pontas. Ex.: remapear(0.9, 0.85, 1) → 0.333...
function remapear(valor: number, inicio: number, fim: number) {
  return limitar((valor - inicio) / (fim - inicio), 0, 1);
}

export default function HeroHelix() {
  const secaoRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tituloRef = useRef<HTMLDivElement>(null);

  // Guarda cada <img> já carregada, indexada pelo mesmo índice base 0
  // dos frames (null = ainda não carregada). Inicializado só uma vez.
  const imagensRef = useRef<(HTMLImageElement | null)[] | null>(null);
  if (!imagensRef.current) {
    imagensRef.current = Array.from({ length: TOTAL_DE_FRAMES }, () => null);
  }

  useEffect(() => {
    const secao = secaoRef.current;
    const canvas = canvasRef.current;
    const titulo = tituloRef.current;
    if (!secao || !canvas || !titulo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imagens = imagensRef.current!;

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Flag de cancelamento: quando o componente sai de tela, marcamos
    // como true e todo lote de pré-carregamento em andamento para de
    // agendar o próximo (evita trabalho e "vazamento" assíncrono).
    let cancelado = false;

    // Último índice DESENHADO no canvas e o índice que o scroll está
    // "pedindo" agora — podem diferir quando o frame pedido ainda não
    // carregou.
    let ultimoIndiceDesenhado = -1;
    let indiceDesejado = INDICE_DO_POSTER;

    // ------------------------------------------------------------
    // Desenho: "cover fit" — escala a imagem pra cobrir o canvas
    // inteiro sem distorcer, cortando o excesso e centralizando.
    // ------------------------------------------------------------
    function desenharFrame(indice: number) {
      const img = imagens[indice];
      if (!img) return; // nunca deixa o canvas em branco

      const larguraCanvas = canvas!.width;
      const alturaCanvas = canvas!.height;

      ctx!.clearRect(0, 0, larguraCanvas, alturaCanvas);

      const aspectImagem = img.naturalWidth / img.naturalHeight;
      const aspectCanvas = larguraCanvas / alturaCanvas;

      let larguraDesenho: number;
      let alturaDesenho: number;
      if (aspectImagem > aspectCanvas) {
        alturaDesenho = alturaCanvas;
        larguraDesenho = alturaCanvas * aspectImagem;
      } else {
        larguraDesenho = larguraCanvas;
        alturaDesenho = larguraCanvas / aspectImagem;
      }

      const x = (larguraCanvas - larguraDesenho) / 2;
      const y = (alturaCanvas - alturaDesenho) / 2;

      ctx!.drawImage(img, x, y, larguraDesenho, alturaDesenho);
    }

    // Procura, do índice pedido pra trás, o frame mais próximo que já
    // carregou. Retorna null se nada até ali (inclusive) carregou.
    function melhorIndiceDisponivel(alvo: number): number | null {
      for (let i = alvo; i >= 0; i--) {
        if (imagens[i]) return i;
      }
      return null;
    }

    // Atualiza o que está desenhado pra refletir o índice desejado
    // ATUAL — chamada tanto quando o scroll se move quanto quando uma
    // nova imagem termina de carregar.
    function atualizarDesenhoParaAlvo() {
      const melhor = melhorIndiceDisponivel(indiceDesejado);
      if (melhor !== null && melhor !== ultimoIndiceDesenhado) {
        desenharFrame(melhor);
        ultimoIndiceDesenhado = melhor;
      }
    }

    // ------------------------------------------------------------
    // Redimensionamento: recalcula o canvas em pixels reais (largura
    // CSS × densidade de tela, limitada a 2x) e redesenha o frame atual.
    // ------------------------------------------------------------
    function ajustarTamanho() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;

      const indiceParaRedesenhar =
        ultimoIndiceDesenhado >= 0
          ? ultimoIndiceDesenhado
          : melhorIndiceDisponivel(indiceDesejado);
      if (indiceParaRedesenhar !== null) {
        desenharFrame(indiceParaRedesenhar);
        ultimoIndiceDesenhado = indiceParaRedesenhar;
      }
    }

    // ------------------------------------------------------------
    // Carregamento progressivo
    // ------------------------------------------------------------
    function carregarFrame(indice: number): Promise<void> {
      return new Promise((resolve) => {
        if (imagens[indice] || cancelado) {
          resolve();
          return;
        }
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          imagens[indice] = img;
          resolve();
          if (!cancelado && indice <= indiceDesejado) {
            atualizarDesenhoParaAlvo();
          }
        };
        // Se uma foto específica falhar, não travamos o lote inteiro.
        img.onerror = () => resolve();
        img.src = caminhoDoFrame(indice);
      });
    }

    async function precarregarTodosOsFrames() {
      for (let inicio = 0; inicio < TOTAL_DE_FRAMES; inicio += TAMANHO_DO_LOTE) {
        if (cancelado) return;
        const indicesDoLote: number[] = [];
        for (
          let i = inicio;
          i < Math.min(inicio + TAMANHO_DO_LOTE, TOTAL_DE_FRAMES);
          i++
        ) {
          indicesDoLote.push(i);
        }
        await Promise.all(indicesDoLote.map((i) => carregarFrame(i)));
      }
    }

    // ------------------------------------------------------------
    // Aplica o estado visual da DISSOLUÇÃO para um dado progresso de
    // "melt" (0 = foguete cheio na tela; 1 = foguete sumido, título
    // pronto). Fica numa função só pra ser usada tanto pelo scroll
    // quanto pelo caminho de "reduzir movimento".
    // ------------------------------------------------------------
    function aplicarDissolucao(melt: number) {
      // Canvas some e afasta levemente.
      canvas!.style.opacity = String(1 - melt);
      canvas!.style.transform = `scale(${1 + (ESCALA_NA_DISSOLUCAO - 1) * melt})`;

      // Título aparece (e, se aceita movimento, sobe um pouquinho).
      titulo!.style.opacity = String(melt);
      titulo!.style.transform = reduzMovimento
        ? "none"
        : `translateY(${(1 - melt) * 24}px)`;
    }

    // 1) Monta o canvas no tamanho certo.
    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    // 2) Carrega o pôster e desenha assim que chegar (a pessoa já vê
    // algo o quanto antes, sem esperar o resto).
    carregarFrame(INDICE_DO_POSTER).then(() => {
      if (!cancelado) atualizarDesenhoParaAlvo();
    });

    // ------------------------------------------------------------
    // Caminho A — REDUZIR MOVIMENTO: sem scrub, sem dissolução
    // animada. Mostra o último quadro (foguete já no céu) e o título
    // prontos, estáticos. Não pina a seção nem baixa os 123 frames.
    // ------------------------------------------------------------
    if (reduzMovimento) {
      carregarFrame(TOTAL_DE_FRAMES - 1).then(() => {
        if (cancelado) return;
        indiceDesejado = TOTAL_DE_FRAMES - 1;
        atualizarDesenhoParaAlvo();
        aplicarDissolucao(0); // canvas visível, título já pronto
        titulo.style.opacity = "1";
      });
      return () => {
        cancelado = true;
        window.removeEventListener("resize", ajustarTamanho);
      };
    }

    // ------------------------------------------------------------
    // Caminho B — COM MOVIMENTO: pré-carrega tudo e liga o scrub +
    // dissolução via ScrollTrigger (seção presa por 350% da altura).
    // ------------------------------------------------------------
    precarregarTodosOsFrames();

    // Envolvemos a criação do ScrollTrigger num gsap.context ligado à
    // seção. Isso é ESSENCIAL por causa do "pin": o GSAP embrulha a
    // seção presa num elemento extra (pin-spacer) no HTML, por fora do
    // React. Ao trocar de página, o React desmonta este componente — e,
    // se esse embrulho não for desfeito ANTES, o React tenta remover um
    // nó que "mudou de lugar" e estoura o erro "Failed to execute
    // 'removeChild'/'insertBefore' on 'Node'". O ctx.revert() na limpeza
    // desfaz tudo que o GSAP mexeu (inclusive o pin-spacer), na ordem
    // certa, antes do React remover os elementos.
    const contextoGsap = gsap.context(() => {
      ScrollTrigger.create({
        trigger: secao,
        start: "top top",
        end: "+=350%",
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;

          // Fase 1 (0 → FIM_DO_VOO): troca de fotograma. Depois de
          // FIM_DO_VOO o índice fica travado no último quadro.
          const progressoVoo = remapear(p, 0, FIM_DO_VOO);
          indiceDesejado = Math.round(progressoVoo * (TOTAL_DE_FRAMES - 1));
          atualizarDesenhoParaAlvo();

          // Fase 2 (FIM_DO_VOO → 1): dissolução.
          const melt = remapear(p, FIM_DO_VOO, 1);
          aplicarDissolucao(melt);
        },
      });
    }, secao);

    return () => {
      cancelado = true;
      contextoGsap.revert();
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, []);

  return (
    <section
      ref={secaoRef}
      className="relative z-10 h-screen w-full overflow-hidden bg-transparent"
    >
      {/* O canvas do foguete. transform-origin no centro pra escala da
          dissolução crescer a partir do meio da tela. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full origin-center"
      />

      {/* Bloco de título que SURGE na dissolução — começa invisível
          (opacity 0, controlado via .style no efeito acima). */}
      <div
        ref={tituloRef}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0"
      >
        <div className="mx-auto mb-5 h-px w-14 bg-[var(--accent)]" />
        <h1 className="font-display text-4xl font-bold tracking-[0.08em] text-[var(--text)] uppercase drop-shadow-lg md:text-7xl">
          Notícias das Estrelas
        </h1>
        <p className="font-telemetry mt-4 max-w-md text-xs tracking-[0.25em] text-[var(--text-dim)] uppercase md:text-sm">
          Ciência · Espaço · Tecnologia — sem enrolação
        </p>
      </div>
    </section>
  );
}
