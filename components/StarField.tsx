"use client";

/**
 * StarField
 * ---------------------------------------------------------------
 * Fundo de estrelas desenhado em <canvas>, fixo atrás de tudo
 * (z-0). As estrelas se movem em "camadas" — as mais ao fundo
 * andam devagar e as mais à frente andam mais rápido conforme a
 * pessoa rola a página — isso é o "parallax" que dá sensação de
 * profundidade (como olhar estrelas de verdade por uma janela de
 * um veículo em movimento).
 *
 * Por que canvas e não elementos HTML? Com ~200 estrelas, desenhar
 * tudo em um único <canvas> é muito mais leve do que ter 200 <div>
 * no DOM (o navegador não precisa gerenciar 200 elementos separados).
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";

// Cada estrela guarda sua posição e a que "camada" de profundidade
// pertence. Camada 0 = mais longe (anda devagar). Camada 2 = mais
// perto (anda rápido). Isso é o que cria o efeito de parallax.
interface Estrela {
  x: number;
  y: number;
  raio: number;
  camada: number;
  brilho: number;
}

// Uma "estrela cadente" (meteoro) — um risco de luz raro e rápido
// que atravessa a tela na diagonal, some sozinho, e só volta a
// acontecer depois de um tempo aleatório (efeito raro de propósito).
interface EstrelaCadente {
  x: number;
  y: number;
  vx: number; // velocidade horizontal (pixels por segundo)
  vy: number; // velocidade vertical (pixels por segundo)
  vida: number; // quanto tempo (segundos) já se passou desde que nasceu
  vidaMax: number; // duração total antes de sumir
}

const NUMERO_DE_CAMADAS = 3;
// Multiplicador de velocidade por camada: fundo bem lento, frente
// mais rápida. "Camadas fundas lentas" = índice 0 tem o menor valor.
const VELOCIDADE_POR_CAMADA = [0.05, 0.15, 0.35];
const LARGURA_TELA_ESTREITA = 640; // abaixo disso, geramos menos estrelas

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs (não useState!) porque o scroll dispara dezenas de vezes
  // por segundo — usar estado do React aqui forçaria re-render a
  // cada pixel rolado, o que seria lento.
  const estrelasRef = useRef<Estrela[]>([]);
  const scrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const reduzMovimentoRef = useRef(false);

  // Estrela cadente ativa no momento (null = nenhuma acontecendo
  // agora). Guardamos o id do requestAnimationFrame e do setTimeout
  // para poder cancelar tudo direitinho na limpeza do useEffect.
  const estrelaCadenteRef = useRef<EstrelaCadente | null>(null);
  const cadenteAnimacaoIdRef = useRef<number | null>(null);
  const cadenteTimeoutIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Quem pediu "reduzir movimento" no sistema não deve ver as
    // estrelas se deslocando junto com o scroll — elas ficam
    // paradas, só visíveis como fundo estático.
    reduzMovimentoRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Cria um novo conjunto de estrelas em posições aleatórias,
    // proporcional ao tamanho da tela atual.
    function gerarEstrelas(largura: number, altura: number) {
      const quantidade = largura < LARGURA_TELA_ESTREITA ? 100 : 200;
      const novasEstrelas: Estrela[] = [];
      for (let i = 0; i < quantidade; i++) {
        novasEstrelas.push({
          x: Math.random() * largura,
          y: Math.random() * altura,
          raio: Math.random() * 1.4 + 0.3,
          camada: Math.floor(Math.random() * NUMERO_DE_CAMADAS),
          brilho: Math.random() * 0.5 + 0.5,
        });
      }
      estrelasRef.current = novasEstrelas;
    }

    // Desenha um quadro: limpa o canvas e redesenha cada estrela na
    // posição atual (deslocada pelo scroll, conforme sua camada).
    function desenhar() {
      const largura = canvas!.width;
      const altura = canvas!.height;

      // Proteção: se por algum motivo o array de estrelas estiver
      // vazio mas a tela já tem largura válida, recria as estrelas
      // antes de desenhar (evita ficar com o fundo vazio caso algo
      // dê errado na primeira geração).
      if (estrelasRef.current.length === 0 && largura > 0) {
        gerarEstrelas(largura, altura);
      }

      ctx!.clearRect(0, 0, largura, altura);

      const scrollY = reduzMovimentoRef.current ? 0 : scrollYRef.current;

      for (const estrela of estrelasRef.current) {
        const velocidade = VELOCIDADE_POR_CAMADA[estrela.camada];
        // "% altura" faz a estrela reaparecer no topo quando sai da
        // tela por baixo — um loop infinito de parallax.
        let y = (estrela.y + scrollY * velocidade) % altura;
        if (y < 0) y += altura;

        ctx!.beginPath();
        ctx!.arc(estrela.x, y, estrela.raio, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${estrela.brilho})`;
        ctx!.fill();
      }

      // Desenha a estrela cadente por cima das estrelas normais,
      // caso alguma esteja "acontecendo" agora (ver agendarCadente).
      const cadente = estrelaCadenteRef.current;
      if (cadente) {
        const progresso = cadente.vida / cadente.vidaMax;
        const opacidade = Math.max(0, 1 - progresso);
        const comprimentoRastro = 90; // em pixels
        const angulo = Math.atan2(cadente.vy, cadente.vx);
        const caudaX = cadente.x - Math.cos(angulo) * comprimentoRastro;
        const caudaY = cadente.y - Math.sin(angulo) * comprimentoRastro;

        // Gradiente: cabeça bem brilhante, rastro se apagando.
        const gradiente = ctx!.createLinearGradient(
          cadente.x,
          cadente.y,
          caudaX,
          caudaY
        );
        gradiente.addColorStop(0, `rgba(255, 255, 255, ${opacidade})`);
        gradiente.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx!.strokeStyle = gradiente;
        ctx!.lineWidth = 1.6;
        ctx!.beginPath();
        ctx!.moveTo(cadente.x, cadente.y);
        ctx!.lineTo(caudaX, caudaY);
        ctx!.stroke();
      }
    }

    // Agenda a PRÓXIMA estrela cadente, depois de um tempo
    // aleatório entre 8 e 15 segundos — é o que faz o efeito ser
    // raro (não uma a cada poucos segundos).
    function agendarProximaCadente() {
      // Quem pediu "reduzir movimento" no sistema nunca vê estrelas
      // cadentes (são puramente decorativas e chamativas).
      if (reduzMovimentoRef.current) return;

      const atraso = 8000 + Math.random() * 7000; // 8s a 15s
      cadenteTimeoutIdRef.current = window.setTimeout(() => {
        const largura = canvas!.width;
        const altura = canvas!.height;
        const velocidadeBase = 380 + Math.random() * 160; // pixels/s

        estrelaCadenteRef.current = {
          x: Math.random() * largura * 0.5,
          y: Math.random() * altura * 0.25,
          vx: velocidadeBase,
          vy: velocidadeBase * 0.45, // desce na diagonal, mais reto que fundo
          vida: 0,
          vidaMax: 0.55 + Math.random() * 0.25, // meio segundo, mais ou menos
        };

        animarCadente();
      }, atraso);
    }

    // Roda um quadro por vez, movendo a estrela cadente até ela
    // completar sua "vida" — só então volta a desenhar tudo parado
    // e agenda a próxima (depois de outro intervalo aleatório).
    function animarCadente() {
      let ultimoInstante: number | null = null;

      function passo(instanteAtual: number) {
        const cadente = estrelaCadenteRef.current;
        if (!cadente) return;

        if (ultimoInstante === null) ultimoInstante = instanteAtual;
        const deltaSegundos = (instanteAtual - ultimoInstante) / 1000;
        ultimoInstante = instanteAtual;

        cadente.x += cadente.vx * deltaSegundos;
        cadente.y += cadente.vy * deltaSegundos;
        cadente.vida += deltaSegundos;

        if (cadente.vida >= cadente.vidaMax) {
          estrelaCadenteRef.current = null;
          desenhar();
          agendarProximaCadente();
          return;
        }

        desenhar();
        cadenteAnimacaoIdRef.current = requestAnimationFrame(passo);
      }

      cadenteAnimacaoIdRef.current = requestAnimationFrame(passo);
    }

    // Redimensiona o canvas pro tamanho real da janela e gera
    // estrelas novas (a quantidade/posição depende do tamanho).
    function ajustarTamanho() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      gerarEstrelas(canvas!.width, canvas!.height);
      desenhar();
    }

    // Evento de scroll: NUNCA redesenha direto aqui. Só guarda a
    // posição mais recente e agenda um requestAnimationFrame (rAF),
    // que é o "momento certo" pro navegador redesenhar sem travar
    // a rolagem. "passive: true" avisa o navegador que este listener
    // não vai bloquear o scroll, deixando tudo mais fluido.
    function aoRolar() {
      scrollYRef.current = window.scrollY;
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(() => {
          desenhar();
          tickingRef.current = false;
        });
      }
    }

    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);
    window.addEventListener("scroll", aoRolar, { passive: true });
    agendarProximaCadente();

    // Limpeza completa: remove os dois listeners e cancela qualquer
    // estrela cadente pendente/em andamento, quando o componente sai
    // da tela, pra não vazar memória nem continuar rodando em segundo
    // plano.
    return () => {
      window.removeEventListener("resize", ajustarTamanho);
      window.removeEventListener("scroll", aoRolar);
      if (cadenteTimeoutIdRef.current !== null) {
        window.clearTimeout(cadenteTimeoutIdRef.current);
      }
      if (cadenteAnimacaoIdRef.current !== null) {
        cancelAnimationFrame(cadenteAnimacaoIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full bg-[var(--bg)]"
    />
  );
}
