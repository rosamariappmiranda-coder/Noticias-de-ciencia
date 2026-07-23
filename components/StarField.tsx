"use client";

/**
 * StarField — o fundo vivo do NEXO
 * ---------------------------------------------------------------
 * Um céu de estrelas desenhado em <canvas>, fixo atrás de tudo
 * (z-0), que reage a DUAS coisas ao mesmo tempo:
 *
 *   • SCROLL  → as camadas se deslocam em velocidades diferentes
 *     (parallax), dando sensação de profundidade ao rolar.
 *   • CURSOR  → as estrelas se afastam de leve na direção contrária
 *     ao mouse, como se a câmera se movesse pelo espaço. As mais
 *     "à frente" reagem mais que as "ao fundo".
 *
 * Além disso: cintilação suave (cada estrela pulsa no seu ritmo),
 * um halo que acende as estrelas perto do cursor, duas nebulosas
 * discretas ao fundo e a estrela cadente rara de sempre.
 *
 * DECISÃO DE ARQUITETURA: a versão antiga só redesenhava no evento
 * de scroll. Para o cursor deslizar suave e as estrelas cintilarem,
 * agora existe um LAÇO DE ANIMAÇÃO contínuo (requestAnimationFrame),
 * que pausa sozinho quando a aba perde o foco — assim não gasta
 * bateria à toa numa aba que ninguém está vendo.
 *
 * Por que <canvas> e não elementos HTML? Com ~200 estrelas, desenhar
 * tudo num único canvas é muito mais leve do que 200 <div> no DOM.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";

// Cada estrela guarda a posição BASE (sem deslocamentos), a camada
// de profundidade e os parâmetros da cintilação. Os deslocamentos de
// scroll e de cursor são somados só na hora de desenhar — assim a
// posição base nunca "escorrega".
interface Estrela {
  x: number; // posição base horizontal, em pixels
  y: number; // posição base vertical, em pixels
  raio: number;
  camada: number; // 0 = mais longe (reage pouco), 2 = mais perto
  brilhoBase: number; // opacidade de repouso
  fase: number; // deslocamento inicial da cintilação (radianos)
  velCintilacao: number; // quão rápido essa estrela pulsa
}

// Uma nebulosa: uma mancha de cor grande, muito suave, que respira e
// deriva devagar ao fundo. A diretriz do produto pede "pequenas
// nebulosas discretas" — a palavra-chave é discretas.
interface Nebulosa {
  x: number; // centro, como fração da tela (0 a 1) — resiste a resize
  y: number;
  raio: number; // em pixels
  cor: string; // rgb sem alpha; o alpha entra no gradiente
  camada: number; // reage ao cursor como as estrelas (fundo = pouco)
}

// Uma estrela cadente (meteoro) — rara e rápida, atravessa em diagonal.
interface EstrelaCadente {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  vidaMax: number;
}

const NUMERO_DE_CAMADAS = 3;

// Deslocamento por camada no PARALLAX DE SCROLL (multiplica o scrollY).
const VELOCIDADE_SCROLL_POR_CAMADA = [0.05, 0.15, 0.35];

// Deslocamento por camada no PARALLAX DE CURSOR, em pixels. A câmera
// "vira" na direção contrária ao mouse; camadas da frente reagem mais.
const DESLOCAMENTO_CURSOR_POR_CAMADA = [4, 11, 24];

const LARGURA_TELA_ESTREITA = 640; // abaixo disso, menos estrelas

// Halo do cursor: estrelas dentro deste raio (px) acendem.
const RAIO_DO_HALO = 170;
const FORCA_DO_HALO = 1.1;

// Suavização do cursor (0 a 1). A posição desenhada persegue a real
// esta fração por quadro. Baixo = deslize elegante; alto = grudado.
const SUAVIDADE_CURSOR = 0.06;

// Nunca desenhar acima do dobro da densidade de pixels — em telas
// Retina (dpr 3) um canvas em resolução nativa custa caro sem ganho.
const DPR_MAXIMO = 2;

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tudo que muda a cada quadro mora em ref, NUNCA em useState — a
  // 60 quadros por segundo, re-renderizar o React derrubaria tudo.
  const estrelasRef = useRef<Estrela[]>([]);
  const nebulosasRef = useRef<Nebulosa[]>([]);
  const scrollYRef = useRef(0);
  const reduzMovimentoRef = useRef(false);

  // Cursor: posição-alvo (para onde foi) e desenhada (onde a animação
  // está). A distância entre as duas é o que cria o deslize suave.
  const cursorAlvoRef = useRef({ x: 0.5, y: 0.5 });
  const cursorSuaveRef = useRef({ x: 0.5, y: 0.5 });

  const animacaoIdRef = useRef<number | null>(null);
  const estrelaCadenteRef = useRef<EstrelaCadente | null>(null);
  const cadenteTimeoutIdRef = useRef<number | null>(null);
  const proximaCadenteEmRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ACESSIBILIDADE: quem pediu "reduzir movimento" no sistema vê o
    // céu PARADO — as estrelas aparecem, mas nada se move.
    const consultaMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    reduzMovimentoRef.current = consultaMovimento.matches;

    // Cursor só é rastreado em quem tem mouse de verdade. Em celular
    // não existe "hover", e escutar o toque ali gastaria bateria à toa.
    const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)");

    let largura = 0;
    let altura = 0;

    // -----------------------------------------------------------
    // Geração de estrelas e nebulosas
    // -----------------------------------------------------------
    function gerarEstrelas() {
      const quantidade = largura < LARGURA_TELA_ESTREITA ? 110 : 210;
      const novas: Estrela[] = [];
      for (let i = 0; i < quantidade; i++) {
        // Viés para o fundo: a maioria fica distante e pequena, poucas
        // "à frente" — é assim que um céu real se parece.
        const sorteio = Math.random();
        const camada = sorteio < 0.55 ? 0 : sorteio < 0.85 ? 1 : 2;
        novas.push({
          x: Math.random() * largura,
          y: Math.random() * altura,
          raio: 0.4 + camada * 0.35 + Math.random() * 0.5,
          camada,
          brilhoBase: 0.35 + camada * 0.14 + Math.random() * 0.28,
          fase: Math.random() * Math.PI * 2,
          velCintilacao: 0.4 + Math.random() * 1.1,
        });
      }
      estrelasRef.current = novas;
    }

    function gerarNebulosas() {
      // Duas manchas: uma azul, uma violeta — as cores do NEXO. Bem
      // grandes e bem apagadas, para dar profundidade sem competir
      // com o conteúdo. Posição em fração (0-1) resiste a resize.
      nebulosasRef.current = [
        { x: 0.22, y: 0.3, raio: 460, cor: "91, 140, 255", camada: 0 },
        { x: 0.8, y: 0.72, raio: 520, cor: "167, 139, 250", camada: 1 },
      ];
    }

    // -----------------------------------------------------------
    // Desenho de um quadro
    // -----------------------------------------------------------
    function desenhar(tempoMs: number) {
      const tempo = tempoMs / 1000;

      ctx!.clearRect(0, 0, largura, altura);

      // Cursor desenhado persegue o alvo (interpolação linear "lerp").
      const suave = cursorSuaveRef.current;
      const alvo = cursorAlvoRef.current;
      suave.x += (alvo.x - suave.x) * SUAVIDADE_CURSOR;
      suave.y += (alvo.y - suave.y) * SUAVIDADE_CURSOR;

      // Desvio -1..+1 a partir do centro (mais conveniente p/ parallax).
      const desvioX = reduzMovimentoRef.current ? 0 : (suave.x - 0.5) * 2;
      const desvioY = reduzMovimentoRef.current ? 0 : (suave.y - 0.5) * 2;
      const cursorPxX = suave.x * largura;
      const cursorPxY = suave.y * altura;
      const scrollY = reduzMovimentoRef.current ? 0 : scrollYRef.current;

      // --- Nebulosas (fundo de tudo) ---
      for (const neb of nebulosasRef.current) {
        const forcaCursor = DESLOCAMENTO_CURSOR_POR_CAMADA[neb.camada] * 1.4;
        // Deriva lenta e independente por nebulosa (o *0.13 e a fase
        // pelo raio fazem cada uma respirar num ritmo próprio).
        const derivaX = Math.sin(tempo * 0.05 + neb.raio) * 18;
        const derivaY = Math.cos(tempo * 0.04 + neb.raio) * 14;
        const cx = neb.x * largura - desvioX * forcaCursor + derivaX;
        const cy = neb.y * altura - desvioY * forcaCursor + derivaY;

        const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, neb.raio);
        // Alpha bem baixo: é atmosfera, não desenho.
        grad.addColorStop(0, `rgba(${neb.cor}, 0.06)`);
        grad.addColorStop(1, `rgba(${neb.cor}, 0)`);
        ctx!.fillStyle = grad;
        ctx!.fillRect(cx - neb.raio, cy - neb.raio, neb.raio * 2, neb.raio * 2);
      }

      // --- Estrelas ---
      for (const estrela of estrelasRef.current) {
        const velScroll = VELOCIDADE_SCROLL_POR_CAMADA[estrela.camada];
        const forcaCursor = DESLOCAMENTO_CURSOR_POR_CAMADA[estrela.camada];

        // Posição = base + parallax de scroll + parallax de cursor.
        // O "% altura" reidrata a estrela no topo quando ela sai por
        // baixo — loop infinito de parallax.
        let y = (estrela.y + scrollY * velScroll) % altura;
        if (y < 0) y += altura;
        const x = estrela.x - desvioX * forcaCursor;
        y = y - desvioY * forcaCursor;

        // Cintilação: cada estrela pulsa na própria fase e velocidade,
        // então nunca piscam todas juntas (o que denunciaria "robô").
        const pulso = reduzMovimentoRef.current
          ? 1
          : 0.8 + 0.2 * Math.sin(tempo * estrela.velCintilacao + estrela.fase);

        // Halo: quanto mais perto do cursor, mais a estrela acende.
        const dx = x - cursorPxX;
        const dy = y - cursorPxY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximidade = Math.max(0, 1 - dist / RAIO_DO_HALO);
        // Ao quadrado = halo concentrado no centro, cai rápido na borda.
        const aceso = proximidade * proximidade * FORCA_DO_HALO;

        const brilho = Math.min(1, estrela.brilhoBase * pulso + aceso);
        const raio = estrela.raio * (1 + aceso * 0.5);

        // Estrelas acesas puxam para o azul de destaque; em repouso,
        // brancas.
        const canalAzul = 255;
        const canalVerde = Math.round(255 - aceso * 30);
        const canalVermelho = Math.round(255 - aceso * 55);

        ctx!.beginPath();
        ctx!.arc(x, y, raio, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${canalVermelho}, ${canalVerde}, ${canalAzul}, ${brilho})`;
        ctx!.fill();
      }

      // --- Estrela cadente (por cima de tudo) ---
      atualizarEDesenharCadente(tempo);
    }

    // -----------------------------------------------------------
    // Estrela cadente — agora movida pelo tempo do laço principal
    // (não tem mais laço próprio, é mais simples e barato).
    // -----------------------------------------------------------
    let ultimoTempoCadente = 0;
    function atualizarEDesenharCadente(tempo: number) {
      if (reduzMovimentoRef.current) return;

      const cadente = estrelaCadenteRef.current;

      // Nenhuma acontecendo: chegou a hora de nascer a próxima?
      if (!cadente) {
        if (proximaCadenteEmRef.current === 0) {
          // primeira vez: agenda para daqui a 8-15s
          proximaCadenteEmRef.current = tempo + 8 + Math.random() * 7;
        } else if (tempo >= proximaCadenteEmRef.current) {
          const velBase = 380 + Math.random() * 160;
          estrelaCadenteRef.current = {
            x: Math.random() * largura * 0.5,
            y: Math.random() * altura * 0.25,
            vx: velBase,
            vy: velBase * 0.45,
            vida: 0,
            vidaMax: 0.55 + Math.random() * 0.25,
          };
          ultimoTempoCadente = tempo;
        }
        return;
      }

      // Avança a cadente pelo tempo decorrido desde o último quadro.
      const delta = tempo - ultimoTempoCadente;
      ultimoTempoCadente = tempo;
      cadente.x += cadente.vx * delta;
      cadente.y += cadente.vy * delta;
      cadente.vida += delta;

      if (cadente.vida >= cadente.vidaMax) {
        estrelaCadenteRef.current = null;
        proximaCadenteEmRef.current = tempo + 8 + Math.random() * 7;
        return;
      }

      // Desenha o risco com rastro que se apaga.
      const opacidade = Math.max(0, 1 - cadente.vida / cadente.vidaMax);
      const angulo = Math.atan2(cadente.vy, cadente.vx);
      const caudaX = cadente.x - Math.cos(angulo) * 90;
      const caudaY = cadente.y - Math.sin(angulo) * 90;
      const grad = ctx!.createLinearGradient(
        cadente.x,
        cadente.y,
        caudaX,
        caudaY
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${opacidade})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 1.6;
      ctx!.beginPath();
      ctx!.moveTo(cadente.x, cadente.y);
      ctx!.lineTo(caudaX, caudaY);
      ctx!.stroke();
    }

    // -----------------------------------------------------------
    // O laço principal
    // -----------------------------------------------------------
    function laco(tempoMs: number) {
      desenhar(tempoMs);
      animacaoIdRef.current = requestAnimationFrame(laco);
    }

    // -----------------------------------------------------------
    // Tamanho do canvas (com nitidez Retina via devicePixelRatio)
    // -----------------------------------------------------------
    function ajustarTamanho() {
      largura = window.innerWidth;
      altura = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);

      canvas!.style.width = `${largura}px`;
      canvas!.style.height = `${altura}px`;
      canvas!.width = Math.floor(largura * dpr);
      canvas!.height = Math.floor(altura * dpr);
      // Escala o contexto pelo dpr: desenhamos em coordenadas "lógicas"
      // (px de CSS) e o canvas fica nítido mesmo em tela de alta densidade.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      gerarEstrelas();
      gerarNebulosas();
    }

    // -----------------------------------------------------------
    // Eventos
    // -----------------------------------------------------------
    // Scroll: só guarda a posição; quem redesenha é o laço contínuo.
    // capture:true pega o scroll de QUALQUER elemento (body ou um feed
    // com overflow próprio) — eventos de scroll não sobem pela árvore,
    // mas descem na fase de captura.
    function aoRolar(evento: Event) {
      scrollYRef.current =
        evento.target instanceof HTMLElement
          ? evento.target.scrollTop
          : window.scrollY;
    }

    function aoMoverMouse(evento: PointerEvent) {
      cursorAlvoRef.current = {
        x: evento.clientX / window.innerWidth,
        y: evento.clientY / window.innerHeight,
      };
    }

    // Cursor saiu da janela: volta devagar ao centro (não congela torto).
    function aoSairMouse() {
      cursorAlvoRef.current = { x: 0.5, y: 0.5 };
    }

    // ECONOMIA DE BATERIA: aba escondida → para o laço. Volta ao focar.
    function aoTrocarVisibilidade() {
      if (document.hidden) {
        if (animacaoIdRef.current !== null) {
          cancelAnimationFrame(animacaoIdRef.current);
          animacaoIdRef.current = null;
        }
      } else if (animacaoIdRef.current === null) {
        animacaoIdRef.current = requestAnimationFrame(laco);
      }
    }

    function aoMudarPreferencia(evento: MediaQueryListEvent) {
      reduzMovimentoRef.current = evento.matches;
    }

    ajustarTamanho();
    animacaoIdRef.current = requestAnimationFrame(laco);

    window.addEventListener("resize", ajustarTamanho);
    window.addEventListener("scroll", aoRolar, { passive: true, capture: true });
    document.addEventListener("visibilitychange", aoTrocarVisibilidade);
    consultaMovimento.addEventListener("change", aoMudarPreferencia);

    if (temMouse.matches) {
      window.addEventListener("pointermove", aoMoverMouse, { passive: true });
      document.addEventListener("pointerleave", aoSairMouse);
    }

    // Limpeza completa ao sair da tela — evita vazamento de memória e
    // laços rodando em segundo plano.
    return () => {
      if (animacaoIdRef.current !== null) {
        cancelAnimationFrame(animacaoIdRef.current);
      }
      if (cadenteTimeoutIdRef.current !== null) {
        window.clearTimeout(cadenteTimeoutIdRef.current);
      }
      window.removeEventListener("resize", ajustarTamanho);
      window.removeEventListener("scroll", aoRolar, { capture: true });
      document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
      consultaMovimento.removeEventListener("change", aoMudarPreferencia);
      window.removeEventListener("pointermove", aoMoverMouse);
      document.removeEventListener("pointerleave", aoSairMouse);
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
