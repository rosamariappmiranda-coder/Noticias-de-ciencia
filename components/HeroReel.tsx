"use client";

/**
 * HeroReel
 * ---------------------------------------------------------------
 * O slide 0 do feed: a mesma sequência de 123 fotogramas da ignição
 * do foguete usada em LaunchFrames.tsx, mas tocada de um jeito
 * DIFERENTE — em vez de avançar/voltar conforme o scroll (uma foto
 * por "pedacinho" de rolagem), aqui ela toca sozinha, POR TEMPO,
 * assim que os 123 quadros terminam de carregar: começa no primeiro
 * frame e roda até o último a ~24 quadros por segundo (123 quadros ÷
 * 24 ≈ 5 segundos), aí congela.
 *
 * A técnica de desenho no <canvas> ("cover fit": a foto cobre o
 * quadro inteiro sem distorcer, cortando o excesso) e o
 * pré-carregamento em lotes são os MESMOS padrões de LaunchFrames.tsx
 * — copiados e adaptados aqui (não importados: cada componente do
 * projeto mantém sua própria lógica, mais fácil de ler isolado).
 *
 * Diferença importante em relação a LaunchFrames: lá, o progresso do
 * scroll dizia QUAL frame desenhar a qualquer momento (podia até
 * "pular" quadros se a pessoa rolasse rápido). Aqui a sequência toda
 * só começa a tocar depois que TODOS os 123 quadros já estão na
 * memória — assim a animação nunca "engasga" esperando uma foto
 * chegar da internet no meio da reprodução.
 *
 * Etapa "Centro de Comando": além de desenhar os quadros, o
 * componente agora também acompanha a "fase da missão" (um
 * `useState` simples) e mostra isso em texto acima do título —
 * "PRONTO PARA LANÇAMENTO" antes de tocar, "IGNIÇÃO" assim que a
 * sequência começa a rodar, "TORRE LIVRE — BOA VIAGEM" quando ela
 * termina e congela no último quadro. Não mexemos em NADA da lógica
 * de canvas/desenho — só chamamos `setFaseMissao(...)` nos mesmos
 * pontos onde o código já decidia "vou começar a tocar" ou "acabei de
 * terminar".
 * ---------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";

// As três fases da "missão" do Hero, na ordem em que acontecem.
// Guardamos como um tipo (union de strings) em vez de números soltos
// pra ficar óbvio, em qualquer lugar do código, o que cada valor
// significa.
type FaseMissao = "pronto" | "ignicao" | "livre";

// Texto exibido pra cada fase — fica num objeto separado (em vez de
// um monte de `if` no JSX) pra ser fácil de ler e de trocar depois.
const TEXTO_DA_FASE: Record<FaseMissao, string> = {
  pronto: "Pronto para lançamento",
  ignicao: "Ignição",
  livre: "Torre livre — boa viagem",
};

// Mesmo total de fotogramas de LaunchFrames.tsx: public/rocket-frames/
// tem frame-0001.webp até frame-0123.webp.
const TOTAL_DE_FRAMES = 123;

// Velocidade de reprodução da sequência: 24 quadros por segundo é o
// clássico "cinema" — com 123 quadros, a ignição inteira dura pouco
// mais de 5 segundos.
const FPS_DE_REPRODUCAO = 24;

// Quantas imagens carregar em paralelo por lote durante o
// pré-carregamento (mesmo valor de LaunchFrames.tsx).
const TAMANHO_DO_LOTE = 12;

// Densidade de pixels máxima usada pro canvas — evita canvases
// gigantes/desperdício de memória em telas com devicePixelRatio muito
// alto, sem perda visual perceptível.
const DPR_MAXIMO = 2;

// Monta o caminho do arquivo a partir do índice (base 0). Ex.:
// caminhoDoFrame(0) → "/rocket-frames/frame-0001.webp"
function caminhoDoFrame(indice: number): string {
  const numeroDoArquivo = String(indice + 1).padStart(4, "0");
  return `/rocket-frames/frame-${numeroDoArquivo}.webp`;
}

function limitar(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

export default function HeroReel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fase atual da missão, exibida no texto de status acima do
  // título. Começa em "pronto" (ainda ninguém apertou o botão de
  // ignição, por assim dizer) — o próprio efeito abaixo decide quando
  // avançar pra "ignicao" e depois "livre".
  const [faseMissao, setFaseMissao] = useState<FaseMissao>("pronto");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Flag de cancelamento: evita que promessas de carregamento ou
    // quadros de animação ainda "no ar" tentem desenhar depois que o
    // componente já saiu de tela.
    let cancelado = false;

    // Cada posição guarda a <img> já carregada daquele fotograma
    // (null = ainda não chegou).
    const imagens: (HTMLImageElement | null)[] = Array.from(
      { length: TOTAL_DE_FRAMES },
      () => null
    );

    // Último índice de fato desenhado no canvas — usado tanto pra
    // evitar redesenhar a mesma foto à toa quanto pra saber o que
    // redesenhar depois de um resize.
    let indiceDesenhado = -1;

    // Id do requestAnimationFrame da reprodução em andamento (se
    // houver), pra poder cancelar de verdade na limpeza do efeito.
    let idAnimacaoAtual: number | null = null;

    // ------------------------------------------------------------
    // Desenho "cover fit" — igual LaunchFrames.tsx: escala a imagem
    // pra cobrir o canvas inteiro sem distorcer, cortando o excesso e
    // centralizando.
    // ------------------------------------------------------------
    function desenharFrame(indice: number) {
      const img = imagens[indice];
      if (!img) return;

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
      indiceDesenhado = indice;
    }

    // ------------------------------------------------------------
    // Redimensionamento: recalcula o canvas no tamanho certo (largura
    // CSS × densidade de tela, limitada a 2x) e redesenha o quadro
    // que já estava na tela, senão o resize deixaria o canvas em
    // branco até o próximo quadro chegar.
    // ------------------------------------------------------------
    function ajustarTamanho() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;

      if (indiceDesenhado >= 0) {
        desenharFrame(indiceDesenhado);
      }
    }

    // ------------------------------------------------------------
    // Carregamento
    // ------------------------------------------------------------

    function carregarImagem(indice: number): Promise<void> {
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
        };
        // Se uma foto específica falhar, não travamos o lote inteiro
        // por causa dela — só seguimos sem preencher aquele índice.
        img.onerror = () => resolve();
        img.src = caminhoDoFrame(indice);
      });
    }

    // Pré-carrega TODOS os 123 frames em lotes de TAMANHO_DO_LOTE, em
    // ordem, sem travar a thread principal.
    async function precarregarTodosOsFrames() {
      for (
        let inicio = 0;
        inicio < TOTAL_DE_FRAMES;
        inicio += TAMANHO_DO_LOTE
      ) {
        if (cancelado) return;
        const indicesDoLote: number[] = [];
        for (
          let i = inicio;
          i < Math.min(inicio + TAMANHO_DO_LOTE, TOTAL_DE_FRAMES);
          i++
        ) {
          indicesDoLote.push(i);
        }
        await Promise.all(indicesDoLote.map((i) => carregarImagem(i)));
      }
    }

    // ------------------------------------------------------------
    // Reprodução: toca a sequência UMA vez, do frame 0 ao último, na
    // velocidade de FPS_DE_REPRODUCAO, e congela no último quadro.
    // Usa o tempo real decorrido (não "um frame por rAF") pra manter
    // a velocidade certa mesmo se algum quadro do navegador atrasar.
    // ------------------------------------------------------------
    function tocarSequenciaUmaVez() {
      const duracaoPorFrameMs = 1000 / FPS_DE_REPRODUCAO;
      let inicioMs: number | null = null;

      function passo(tempoAtual: number) {
        if (cancelado) return;
        if (inicioMs === null) inicioMs = tempoAtual;

        const decorridoMs = tempoAtual - inicioMs;
        const indiceAlvo = limitar(
          Math.floor(decorridoMs / duracaoPorFrameMs),
          0,
          TOTAL_DE_FRAMES - 1
        );

        if (indiceAlvo !== indiceDesenhado) {
          desenharFrame(indiceAlvo);
        }

        if (indiceAlvo < TOTAL_DE_FRAMES - 1) {
          idAnimacaoAtual = requestAnimationFrame(passo);
        } else {
          // Chegou no último quadro: fica parado ali (congelado),
          // sem agendar mais nenhum frame de animação. É também o
          // momento certo de avisar a fase "TORRE LIVRE — BOA VIAGEM"
          // (a ignição terminou e o foguete já subiu).
          idAnimacaoAtual = null;
          if (!cancelado) setFaseMissao("livre");
        }
      }

      // A sequência está prestes a começar a rodar de verdade: avisa
      // a fase "IGNIÇÃO" antes do primeiro `requestAnimationFrame`.
      if (!cancelado) setFaseMissao("ignicao");
      idAnimacaoAtual = requestAnimationFrame(passo);
    }

    // 1) Monta o canvas no tamanho certo desde já.
    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    if (reduzMovimento) {
      // Quem pediu "reduzir movimento": sem playback nenhum — carrega
      // só o ÚLTIMO quadro (o foguete já com o motor aceso) e o
      // desenha direto, sem passar pelos 122 anteriores. A fase da
      // missão já nasce na última etapa também, sem passar por
      // "pronto" nem "ignição".
      carregarImagem(TOTAL_DE_FRAMES - 1).then(() => {
        if (!cancelado) {
          desenharFrame(TOTAL_DE_FRAMES - 1);
          setFaseMissao("livre");
        }
      });
    } else {
      // 2) Desenha o pôster (primeiro quadro) assim que ele chegar,
      // pra pessoa já ver alguma coisa o quanto antes.
      carregarImagem(0).then(() => {
        if (!cancelado) desenharFrame(0);
      });

      // 3) Só depois que TODOS os 123 quadros estiverem prontos é que
      // a sequência começa a tocar de verdade (ver comentário no topo
      // do arquivo sobre a diferença em relação a LaunchFrames).
      precarregarTodosOsFrames().then(() => {
        if (!cancelado) tocarSequenciaUmaVez();
      });
    }

    return () => {
      cancelado = true;
      if (idAnimacaoAtual !== null) {
        cancelAnimationFrame(idAnimacaoAtual);
      }
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />

      {/* Véu de gradiente sutil na base do slide, pra emendar melhor
          com o texto por cima (mesmo espírito do véu usado em
          NewsReel, só que mais discreto — a foto do foguete já tem
          bastante contraste por natureza). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
      />

      {/* Texto de apresentação do portal, ancorado no terço inferior
          do slide — mesma altura aproximada do bloco de texto dos
          NewsReel logo abaixo, pra manter a mesma "régua" visual ao
          rolar de um slide pro outro. Usa a mesma classe
          `.conteudo-reel` (ver globals.css) pra ganhar a mesma
          animação de entrada com fade + subida quando o slide fica
          ativo. */}
      <div className="conteudo-reel pointer-events-none absolute inset-x-0 bottom-[14%] px-6 text-center">
        {/* Status de telemetria: o ● só pisca (`.pulso-sinal`) depois
            que a ignição de fato começa — enquanto ainda está
            "pronto para lançamento", ele fica firme, parado, como um
            painel esperando o comando. */}
        <p
          aria-hidden="true"
          className="font-telemetry mb-3 flex items-center justify-center gap-2 text-[11px] tracking-[0.3em] text-[var(--text-dim)] uppercase"
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] ${
              faseMissao !== "pronto" ? "pulso-sinal" : ""
            }`}
          />
          {TEXTO_DA_FASE[faseMissao]}
        </p>

        {/* Régua de 56px — mesma classe usada acima da categoria em
            NewsReel.tsx, aqui centralizada acima do título pra manter
            a mesma "assinatura visual" de instrumento em todo o
            feed. */}
        <div
          aria-hidden="true"
          className="regua-reel mx-auto mb-4 h-px bg-[var(--accent)]"
        />

        <h1 className="font-display text-3xl font-bold tracking-[0.08em] text-[var(--text)] uppercase drop-shadow-lg md:text-6xl">
          Notícias das Estrelas
        </h1>
        <p className="font-telemetry mx-auto mt-3 max-w-md text-xs tracking-[0.2em] text-[var(--text-dim)] uppercase drop-shadow-lg md:text-sm">
          Ciência · Espaço · Tecnologia — sem enrolação
        </p>
      </div>
    </>
  );
}
