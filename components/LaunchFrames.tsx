"use client";

/**
 * LaunchFrames
 * ---------------------------------------------------------------
 * Hero do site: uma SEQUÊNCIA DE FOTOGRAMAS (123 quadros WebP do
 * vídeo de ignição de motor de foguete, em close-up) dirigida pelo
 * scroll — a mesma mecânica usada pelo site de referência da Rosa
 * (helixearth.com), reproduzida aqui em cima do nosso próprio
 * material.
 *
 * Ideia central: em vez de desenhar formas 3D, a gente troca qual
 * FOTO aparece dentro de um <canvas> conforme a pessoa rola a
 * página. O scroll (0 a 1, "0%" a "100%" da seção presa) vira um
 * índice de 0 a 274 — e só redesenhamos o canvas quando esse índice
 * realmente muda (senão ficaríamos redesenhando a MESMA foto dezenas
 * de vezes por segundo à toa).
 *
 * Assim como em RocketScene, o progresso do scroll NUNCA vira
 * useState (mudaria dezenas de vezes por segundo — re-renderizar o
 * React nesse ritmo seria lento). Tudo fica em refs, e o HTML por
 * cima do canvas (título, telemetria, frase-gancho) é atualizado
 * direto via .style/.textContent dentro do onUpdate do ScrollTrigger.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FRASE_GANCHO } from "./frase-gancho";

gsap.registerPlugin(ScrollTrigger);

// --------------------------------------------------------------
// Configuração dos fotogramas
// --------------------------------------------------------------

// Quantidade total de fotos disponíveis em public/rocket-frames/
// (frame-0001.webp até frame-0123.webp — extraídas do vídeo de
// ignição de motor de foguete escolhido pela Rosa, 12 quadros por
// segundo em WebP, formato de imagem mais leve que JPG).
const TOTAL_DE_FRAMES = 123;

// Índice (base 0) do frame usado como "pôster": a primeira imagem
// mostrada, antes de qualquer scroll. Como o vídeo novo começa com
// os motores ainda apagados em meio à fumaça (composição linda por
// si só), o pôster é o próprio primeiro quadro.
const INDICE_DO_POSTER = 0;

// Quantas imagens carregamos em paralelo por "lote" durante o
// pré-carregamento em segundo plano. Nem todas de uma vez (sobrecarregaria
// a conexão) nem uma por vez (demoraria demais).
const TAMANHO_DO_LOTE = 12;

// Nunca desenhar em mais que o dobro da densidade de pixels "normal"
// — em telas com devicePixelRatio muito alto (ex.: 3), isso evitaria
// canvases gigantes e desperdício de memória/processamento sem ganho
// visual perceptível.
const DPR_MAXIMO = 2;

// Monta o caminho do arquivo a partir do índice (base 0). Ex.:
// caminhoDoFrame(0) → "/rocket-frames/frame-0001.webp"
function caminhoDoFrame(indice: number): string {
  const numeroDoArquivo = String(indice + 1).padStart(4, "0");
  return `/rocket-frames/frame-${numeroDoArquivo}.webp`;
}

// --------------------------------------------------------------
// Funções pequenas de matemática (mesmo espírito das usadas em
// RocketScene — cada arquivo mantém sua própria cópia pequena em vez
// de compartilhar um módulo de utilidades, pra ficar fácil de ler
// isoladamente).
// --------------------------------------------------------------

function limitar(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

function remapear(valor: number, inicio: number, fim: number) {
  return limitar((valor - inicio) / (fim - inicio), 0, 1);
}

export default function LaunchFrames() {
  const secaoRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Overlay em HTML — atualizados via .style/.textContent, nunca
  // useState (mesmo padrão de RocketScene).
  const tituloRef = useRef<HTMLDivElement>(null);
  const fraseRef = useRef<HTMLParagraphElement>(null);
  const segundosRef = useRef<HTMLSpanElement>(null);
  const altitudeRef = useRef<HTMLSpanElement>(null);
  const velocidadeRef = useRef<HTMLSpanElement>(null);

  // Guarda cada <img> já carregada, indexada pelo mesmo índice base 0
  // dos frames (null = ainda não carregada). Inicializado só uma vez,
  // na primeira renderização (o "if" evita recriar o array gigante a
  // cada re-render).
  const imagensRef = useRef<(HTMLImageElement | null)[] | null>(null);
  if (!imagensRef.current) {
    imagensRef.current = Array.from({ length: TOTAL_DE_FRAMES }, () => null);
  }

  useEffect(() => {
    const secao = secaoRef.current;
    const canvas = canvasRef.current;
    const titulo = tituloRef.current;
    const frase = fraseRef.current;
    if (!secao || !canvas || !titulo || !frase) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imagens = imagensRef.current!;

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Flag de cancelamento: quando o componente sai de tela, marcamos
    // como true e todo lote de pré-carregamento ainda em andamento
    // para de agendar o próximo lote (evita trabalho desperdiçado e
    // "vazamento" de tarefas assíncronas rodando depois do unmount).
    let cancelado = false;

    // Último índice de fato DESENHADO no canvas (o que a pessoa está
    // vendo agora), e o índice que o scroll está "pedindo" no momento
    // — podem ser diferentes quando o frame pedido ainda não carregou.
    let ultimoIndiceDesenhado = -1;
    let indiceDesejado = INDICE_DO_POSTER;

    // Densidade de pixels e largura da tela atuais — recalculadas a
    // cada redimensionamento, usadas pra montar o canvas no tamanho
    // certo.
    let dprAtual = 1;
    let larguraCssAtual = window.innerWidth;

    // ------------------------------------------------------------
    // Desenho: "cover fit" — escala a imagem pra cobrir o canvas
    // inteiro sem distorcer, cortando o excesso e centralizando.
    // ------------------------------------------------------------
    function desenharFrame(indice: number) {
      const img = imagens[indice];
      if (!img) return; // nunca deixa o canvas em branco: só troca quando há algo pra mostrar

      const larguraCanvas = canvas!.width;
      const alturaCanvas = canvas!.height;

      ctx!.clearRect(0, 0, larguraCanvas, alturaCanvas);

      const aspectImagem = img.naturalWidth / img.naturalHeight;
      const aspectCanvas = larguraCanvas / alturaCanvas;

      let larguraDesenho: number;
      let alturaDesenho: number;
      if (aspectImagem > aspectCanvas) {
        // Imagem proporcionalmente mais "larga" que o canvas: encaixa
        // pela altura e deixa a largura sobrar pros lados (cortada).
        alturaDesenho = alturaCanvas;
        larguraDesenho = alturaCanvas * aspectImagem;
      } else {
        // Imagem mais "alta"/estreita que o canvas: encaixa pela
        // largura e deixa a altura sobrar em cima/embaixo (cortada).
        larguraDesenho = larguraCanvas;
        alturaDesenho = larguraCanvas / aspectImagem;
      }

      // Corte central puro: o vídeo novo já é um close-up com os
      // motores no centro do quadro, então centralizar o excesso
      // cortado dos dois lados deixa o foguete no meio da tela em
      // qualquer tamanho de janela.
      const x = (larguraCanvas - larguraDesenho) / 2;
      const y = (alturaCanvas - alturaDesenho) / 2;

      ctx!.drawImage(img, x, y, larguraDesenho, alturaDesenho);
    }

    // Procura, a partir do índice pedido e voltando pra trás, o frame
    // mais próximo que já está carregado. Retorna null se nada até
    // ali (inclusive) ainda carregou.
    function melhorIndiceDisponivel(alvo: number): number | null {
      for (let i = alvo; i >= 0; i--) {
        if (imagens[i]) return i;
      }
      return null;
    }

    // Atualiza o que está desenhado pra refletir o índice desejado
    // ATUAL — chamada tanto quando o scroll se move quanto quando uma
    // nova imagem termina de carregar (pode ser que ela seja, agora,
    // a melhor opção disponível pro alvo already pedido).
    function atualizarDesenhoParaAlvo() {
      const melhor = melhorIndiceDisponivel(indiceDesejado);
      if (melhor !== null && melhor !== ultimoIndiceDesenhado) {
        desenharFrame(melhor);
        ultimoIndiceDesenhado = melhor;
      }
    }

    // ------------------------------------------------------------
    // Redimensionamento: recalcula o tamanho do canvas em pixels
    // reais (largura CSS × densidade de tela, limitada a 2x) e
    // redesenha o frame atual (o resize sempre limpa o canvas).
    // ------------------------------------------------------------
    function ajustarTamanho() {
      larguraCssAtual = window.innerWidth;
      dprAtual = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);

      canvas!.width = larguraCssAtual * dprAtual;
      canvas!.height = window.innerHeight * dprAtual;

      // Redesenha o que já estava sendo mostrado (ou o melhor
      // disponível pro alvo atual) — sem isso, o resize deixaria o
      // canvas em branco até o próximo evento de scroll.
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

    // Carrega uma imagem específica (se ainda não carregada) e avisa
    // o canvas caso ela seja, no momento em que termina, a resposta
    // certa pro que o scroll está pedindo agora.
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
        // Se uma foto específica falhar ao carregar (raro, mas
        // possível), não travamos o lote inteiro por causa dela — só
        // seguimos em frente sem preencher aquele índice.
        img.onerror = () => resolve();
        img.src = caminhoDoFrame(indice);
      });
    }

    // Pré-carrega todos os 123 frames em lotes de TAMANHO_DO_LOTE,
    // em ordem (1, 2, 3...), sem travar a thread principal — cada
    // lote roda em paralelo, e só começamos o próximo depois que o
    // anterior termina.
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

    // 1) Primeiro passo: monta o canvas no tamanho certo.
    ajustarTamanho();

    // 2) Segundo passo: carrega SÓ o pôster e desenha assim que
    // chegar — garante que a pessoa já vê alguma coisa (os motores
    // em meio à fumaça) o quanto antes, sem esperar o resto.
    const posterImg = new Image();
    posterImg.decoding = "async";
    posterImg.onload = () => {
      imagens[INDICE_DO_POSTER] = posterImg;
      if (!cancelado) atualizarDesenhoParaAlvo();
    };
    posterImg.src = caminhoDoFrame(INDICE_DO_POSTER);

    // 3) Terceiro passo: só quem NÃO pediu "reduzir movimento" precisa
    // da sequência completa (quem pediu vê só o pôster estático o
    // tempo todo — não faz sentido gastar banda baixando 123 fotos
    // pra uma pessoa que nunca vai vê-las passar).
    if (!reduzMovimento) {
      precarregarTodosOsFrames();
    }

    window.addEventListener("resize", ajustarTamanho);

    // ------------------------------------------------------------
    // ScrollTrigger: seção presa (pin) por 350% da altura da tela.
    // O "scrub: 1" faz o progresso seguir o scroll com um pequeno
    // atraso suave, igual RocketScene/LaunchHero.
    // ------------------------------------------------------------
    const trigger = ScrollTrigger.create({
      trigger: secao,
      start: "top top",
      end: "+=350%",
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;

        // Troca de fotograma: só quem NÃO reduziu movimento. Quem
        // reduziu continua vendo o pôster parado (nenhum "scrub").
        if (!reduzMovimento) {
          indiceDesejado = Math.round(p * (TOTAL_DE_FRAMES - 1));
          atualizarDesenhoParaAlvo();
        }

        // Título ("Notícias da Ciência" + "role para lançar") some
        // rápido assim que a rolagem começa.
        const desaparecimentoTitulo = remapear(p, 0, 0.08);
        titulo.style.opacity = String(1 - desaparecimentoTitulo);
        // A translação (subir/descer) é só para quem aceita
        // movimento — quem reduziu movimento vê apenas o fade puro,
        // sem deslocamento, como pede o requisito de acessibilidade.
        titulo.style.transform = reduzMovimento
          ? "none"
          : `translateY(${-24 * desaparecimentoTitulo}px)`;

        // Frase-gancho entra com fade (+ leve subida, se aceitar
        // movimento) perto do fim do scroll.
        const entradaFrase = remapear(p, 0.88, 1);
        frase.style.opacity = String(entradaFrase);
        frase.style.transform = reduzMovimento
          ? "none"
          : `translateY(${(1 - entradaFrase) * 40}px)`;

        // Telemetria "fake" no rodapé — números sem significado
        // físico real, só pra dar clima de painel de controle (mesmo
        // espírito de RocketScene).
        if (segundosRef.current) {
          segundosRef.current.textContent = (p * 180).toFixed(0);
        }
        if (altitudeRef.current) {
          altitudeRef.current.textContent = (p * 400).toFixed(0);
        }
        if (velocidadeRef.current) {
          velocidadeRef.current.textContent = (p * 7.9).toFixed(2);
        }
      },
    });

    return () => {
      cancelado = true;
      trigger.kill();
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, []);

  return (
    <section
      ref={secaoRef}
      className="relative h-screen w-full overflow-hidden bg-transparent"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0" />

      {/* Véu de gradiente sutil no rodapé do canvas, pra emendar com
          a seção seguinte sem um corte brusco. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-[var(--bg)]" />

      {/* Overlay em HTML por cima do canvas — título, HUD e frase */}
      <div className="pointer-events-none absolute inset-0">
        {/* Brackets HUD nos 4 cantos — mesma linguagem visual do
            RocketScene/CountdownIntro (moldura de painel de controle). */}
        <span className="absolute left-4 top-4 h-8 w-8 border-l border-t border-white/20 sm:left-8 sm:top-8 sm:h-10 sm:w-10" />
        <span className="absolute right-4 top-4 h-8 w-8 border-r border-t border-white/20 sm:right-8 sm:top-8 sm:h-10 sm:w-10" />
        <span className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-white/20 sm:bottom-8 sm:left-8 sm:h-10 sm:w-10" />
        <span className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-white/20 sm:bottom-8 sm:right-8 sm:h-10 sm:w-10" />

        <div
          ref={tituloRef}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <h1 className="font-display text-4xl font-bold tracking-wide text-[var(--text)] drop-shadow-lg md:text-6xl">
            Notícias das Estrelas
          </h1>
          <p className="font-telemetry mt-3 text-sm uppercase tracking-[0.3em] text-[var(--text-dim)]">
            role para lançar
          </p>
        </div>

        <p
          ref={fraseRef}
          className="font-display absolute inset-x-0 bottom-[18%] px-6 text-center text-3xl font-semibold text-[var(--text)] opacity-0 drop-shadow-lg md:text-5xl"
        >
          {FRASE_GANCHO}
        </p>

        {/* Linha de telemetria no rodapé — números que mudam com o
            progresso do scroll. */}
        <div className="font-telemetry absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)] sm:bottom-6 sm:text-xs">
          <span>
            T+ <span ref={segundosRef}>0</span>S
          </span>
          <span aria-hidden="true">·</span>
          <span>
            ALT <span ref={altitudeRef}>0</span> KM
          </span>
          <span aria-hidden="true">·</span>
          <span>
            VEL <span ref={velocidadeRef}>0.00</span> KM/S
          </span>
        </div>
      </div>
    </section>
  );
}
