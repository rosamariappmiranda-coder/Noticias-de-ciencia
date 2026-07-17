"use client";

/**
 * NoticiaImersiva
 * ---------------------------------------------------------------
 * Um "reels" do feed: UMA notícia ocupando quase a tela inteira, com
 * a imagem grande de fundo ANIMADA PELO SCROLL (parallax + zoom) e o
 * texto por cima. É o molde que se repete pra cada uma das 12
 * notícias (ver FeedNoticias.tsx).
 *
 * Três animações, todas no espírito "Framer/HelixEarth" (dirigidas
 * pelo scroll, não por tempo — quem controla é a rolagem):
 *
 *   1) PARALLAX + ZOOM: conforme a notícia atravessa a tela, a imagem
 *      se desloca mais devagar que o texto (profundidade) e vai
 *      afastando de leve (zoom). Feito com GSAP ScrollTrigger + scrub.
 *   2) TEXTO REVELA: categoria, manchete e resumo sobem com fade quando
 *      a notícia entra na tela.
 *   3) REAÇÃO AO CURSOR: a imagem inclina/desloca de leve seguindo o
 *      mouse (efeito de "cartão 3D"), numa CAMADA separada da do scroll
 *      pra as duas não brigarem.
 *
 * Acessibilidade: quem pede "reduzir movimento" no sistema não vê
 * nenhuma dessas três — a imagem fica parada e o texto aparece pronto.
 *
 * Interações (curtir/comentar/salvar/compartilhar): por enquanto são
 * SÓ VISUAIS (o coração enche, o contador sobe na tela), guardadas num
 * `useState` local que some ao recarregar a página. Salvar de verdade
 * num banco de dados é a próxima etapa do projeto (login + Supabase).
 * ---------------------------------------------------------------
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Categoria } from "@/content/noticias";
import type { NoticiaFeed } from "@/lib/tipos-feed";
import { criarClienteNavegador } from "@/lib/supabase/client";
import PainelComentarios from "./PainelComentarios";
import {
  IconeCoracao,
  IconeComentario,
  IconeMarcador,
  IconeCompartilhar,
} from "./Icones";

gsap.registerPlugin(ScrollTrigger);

// Rótulo bonito (em CAIXA ALTA) mostrado pra cada categoria. Fica num
// objeto separado pra ser fácil de ler e trocar depois.
const ROTULO_CATEGORIA: Record<Categoria, string> = {
  espaço: "Espaço",
  tecnologia: "Tecnologia",
  física: "Física",
  biologia: "Biologia",
  ia: "Inteligência Artificial",
};

// Cada categoria tem uma COR de assinatura — o cérebro associa cor a
// assunto muito antes de ler a palavra (codificação visual rápida, o
// mesmo truque de apps grandes). Usada no rótulo, na régua e no glow.
const COR_CATEGORIA: Record<Categoria, string> = {
  espaço: "#5b8cff", // azul — profundidade
  tecnologia: "#ffb56b", // âmbar — energia
  física: "#6be3ff", // ciano — precisão
  biologia: "#7dffa9", // verde — vida
  ia: "#c79bff", // violeta — mistério
};

// Palavra-símbolo de cada categoria, usada gigante e vazada (só
// contorno) no visual reserva das notícias sem imagem — mesma
// linguagem tipográfica do "número fantasma".
const MARCA_CATEGORIA: Record<Categoria, string> = {
  espaço: "ESPAÇO",
  tecnologia: "TECH",
  física: "FÍSICA",
  biologia: "BIO",
  ia: "IA",
};

// Formata a data ISO (AAAA-MM-DD) pra um texto curto em pt-BR, ex.:
// "18 jun 2026". Usa a API nativa do navegador (Intl), sem biblioteca.
function formatarData(dataISO: string): string {
  const data = new Date(dataISO + "T00:00:00");
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Gera um número de curtidas "de mentirinha" porém ESTÁVEL a partir do
// índice — só pra dar vida ao feed enquanto não há banco de dados real.
// (Mesmo índice sempre gera o mesmo número, então não "pula" a cada
// renderização.)
function curtidasIniciais(indice: number): number {
  return 120 + ((indice * 137) % 880);
}

// "Prova social": quantas pessoas estão explorando esta notícia agora.
// Número estável derivado do slug (não pisca a cada render) — quando o
// site tiver tráfego real, trocamos por presença de verdade.
function exploradoresAgora(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return 40 + ((h >>> 0) % 460);
}

// Quem NÃO está logado pode curtir até este limite; da próxima em diante,
// o "porteiro" pede login. A contagem fica guardada no próprio navegador
// da pessoa (localStorage).
const LIMITE_CURTIDAS_ANONIMAS = 5;
const CHAVE_CURTIDAS_ANONIMAS = "curtidas_anonimas_total";

function lerCurtidasAnonimas(): number {
  try {
    return Number(localStorage.getItem(CHAVE_CURTIDAS_ANONIMAS) ?? "0") || 0;
  } catch {
    return 0;
  }
}
function salvarCurtidasAnonimas(valor: number) {
  try {
    localStorage.setItem(CHAVE_CURTIDAS_ANONIMAS, String(Math.max(0, valor)));
  } catch {
    // Se o navegador bloquear o localStorage, tudo bem — o limite só não
    // será lembrado entre recarregamentos.
  }
}

// Mensagem do "porteiro" conforme o que a pessoa tentou fazer sem login.
const MENSAGEM_PORTAO: Record<"curtir" | "comentar" | "salvar", string> = {
  curtir: "Seu gosto já apareceu. Crie uma conta pra o feed aprender com ele.",
  comentar: "Entre pra entrar na conversa.",
  salvar: "Entre pra guardar isso pra depois.",
};

export default function NoticiaImersiva({
  noticia,
  indice,
  usuarioId,
  curtidaInicial,
  salvoInicial,
}: {
  noticia: NoticiaFeed;
  indice: number;
  usuarioId: string | null; // id do usuário logado, ou null se anônimo
  curtidaInicial: boolean; // já curtiu esta notícia? (vem do banco)
  salvoInicial: boolean; // já salvou esta notícia? (vem do banco)
}) {
  const secaoRef = useRef<HTMLElement>(null);
  const camadaCursorRef = useRef<HTMLDivElement>(null); // recebe a inclinação do mouse
  const camadaScrollRef = useRef<HTMLDivElement>(null); // recebe o parallax/zoom
  const textoRef = useRef<HTMLDivElement>(null);

  // Estado das interações. curtiu/salvou já começam com o que veio do
  // banco (pra quem está logado) — assim, ao recarregar, os botões
  // aparecem no estado certo, sem "esquecer" o que a pessoa já fez.
  const [curtiu, setCurtiu] = useState(curtidaInicial);
  const [salvou, setSalvou] = useState(salvoInicial);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [compartilhou, setCompartilhou] = useState(false);

  // "Porteiro": guarda o MOTIVO do bloqueio (pra mostrar a mensagem
  // certa no popup). null = popup fechado.
  const [portao, setPortao] = useState<null | "curtir" | "comentar" | "salvar">(
    null
  );

  const curtidas = curtidasIniciais(indice) + (curtiu ? 1 : 0);

  // Cliente Supabase do navegador — criado só uma vez. É por ele que
  // gravamos/apagamos as interações (a segurança RLS garante que cada
  // pessoa só mexe nas próprias).
  const supabaseRef = useRef<ReturnType<typeof criarClienteNavegador> | null>(
    null
  );
  if (!supabaseRef.current) supabaseRef.current = criarClienteNavegador();

  // --- CURTIR ---
  async function aoCurtir() {
    // Logado: grava/apaga no banco. Atualização "otimista": mexe na tela
    // na hora e, se der erro, desfaz.
    if (usuarioId) {
      const supabase = supabaseRef.current!;
      const novo = !curtiu;
      setCurtiu(novo);
      const { error } = novo
        ? await supabase.from("interacoes").insert({
            user_id: usuarioId,
            noticia_slug: noticia.slug,
            categoria: noticia.categoria,
            tipo: "curtida",
          })
        : await supabase
            .from("interacoes")
            .delete()
            .eq("user_id", usuarioId)
            .eq("noticia_slug", noticia.slug)
            .eq("tipo", "curtida");
      if (error) {
        setCurtiu(!novo);
        console.error("Erro ao curtir:", error.message);
      }
      return;
    }
    // Anônimo: contador local + porteiro a partir da 6ª curtida.
    if (curtiu) {
      setCurtiu(false);
      salvarCurtidasAnonimas(lerCurtidasAnonimas() - 1);
    } else if (lerCurtidasAnonimas() >= LIMITE_CURTIDAS_ANONIMAS) {
      setPortao("curtir");
    } else {
      setCurtiu(true);
      salvarCurtidasAnonimas(lerCurtidasAnonimas() + 1);
    }
  }

  // --- SALVAR --- (sempre exige login)
  async function aoSalvar() {
    if (!usuarioId) {
      setPortao("salvar");
      return;
    }
    const supabase = supabaseRef.current!;
    const novo = !salvou;
    setSalvou(novo);
    const { error } = novo
      ? await supabase.from("interacoes").insert({
          user_id: usuarioId,
          noticia_slug: noticia.slug,
          categoria: noticia.categoria,
          tipo: "salvo",
        })
      : await supabase
          .from("interacoes")
          .delete()
          .eq("user_id", usuarioId)
          .eq("noticia_slug", noticia.slug)
          .eq("tipo", "salvo");
    if (error) {
      setSalvou(!novo);
      console.error("Erro ao salvar:", error.message);
    }
  }

  // Comentar agora abre um PAINEL completo (ver/responder/curtir) — ver
  // o componente PainelComentarios. Aqui só controlamos abrir/fechar,
  // pelo estado mostrarComentarios (no clique do botão). Ver comentários
  // é público; postar/curtir exige login (tratado dentro do painel).

  // --- TEMPO DE ATENÇÃO (watch time) ---------------------------------
  // O sinal favorito do TikTok: se a pessoa PAROU nesta notícia por 2s
  // (60% dela visível na tela), registramos uma 'visualizacao'. O banco
  // ignora repetições (índice único), então cada notícia conta uma vez
  // por usuário — sem inundar a tabela a cada scroll.
  useEffect(() => {
    if (!usuarioId) return; // anônimo: nada de gravar
    const secao = secaoRef.current;
    if (!secao) return;

    let timer: number | null = null;
    let registrada = false;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting && !registrada) {
          timer = window.setTimeout(() => {
            registrada = true;
            supabaseRef
              .current!.from("interacoes")
              .insert({
                user_id: usuarioId,
                noticia_slug: noticia.slug,
                categoria: noticia.categoria,
                tipo: "visualizacao",
              })
              .then(() => {
                // repetição cai no índice único e vem como erro — ok ignorar
              });
          }, 2000);
        } else if (timer !== null) {
          // saiu da tela antes dos 2s: não conta como atenção
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.6 }
    );
    observador.observe(secao);

    return () => {
      observador.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [usuarioId, noticia.slug, noticia.categoria]);

  const cor = COR_CATEGORIA[noticia.categoria];

  useEffect(() => {
    const secao = secaoRef.current;
    const camadaScroll = camadaScrollRef.current;
    const camadaCursor = camadaCursorRef.current;
    const texto = textoRef.current;
    if (!secao || !camadaScroll || !camadaCursor || !texto) return;

    // Quem pediu "reduzir movimento": nenhuma animação. A imagem já
    // nasce cobrindo a seção (ver classes no JSX) e o texto visível.
    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduzMovimento) return;

    // gsap.context agrupa todas as animações criadas aqui dentro pra a
    // gente conseguir DESFAZER tudo de uma vez na limpeza (ctx.revert),
    // evitando ScrollTriggers "fantasmas" acumulando a cada montagem.
    const ctx = gsap.context(() => {
      // 1) Parallax + zoom: a imagem começa maior e um pouco pra cima,
      // e termina um pouco pra baixo e menos ampliada, conforme a seção
      // cruza a tela (start = topo da seção encosta na base da janela;
      // end = base da seção passa pelo topo). "scrub: true" gruda a
      // animação no scroll; "ease: none" deixa o movimento linear com a
      // rolagem (sem acelerar/desacelerar sozinho).
      gsap.fromTo(
        camadaScroll,
        // Zoom contido (1.10 → 1.02): quanto menos ampliamos a foto do
        // portal, menos ela "estoura" os pixels — qualidade percebida.
        { yPercent: -8, scale: 1.1 },
        {
          yPercent: 8,
          scale: 1.02,
          ease: "none",
          scrollTrigger: {
            trigger: secao,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // 2) Texto revela: cada filho do bloco de texto entra com fade +
      // subida, um após o outro (stagger), quando a seção chega a 65%
      // da altura da janela.
      gsap.from(texto.children, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: secao,
          start: "top 65%",
        },
      });
    }, secao);

    // 3) Reação ao cursor: calcula onde o mouse está DENTRO da seção
    // (de -0.5 a 0.5 em cada eixo, com 0 no centro) e inclina/desloca a
    // camada do cursor de leve. transformPerspective dá a sensação 3D.
    function aoMoverMouse(evento: MouseEvent) {
      const area = secao!.getBoundingClientRect();
      const x = (evento.clientX - area.left) / area.width - 0.5;
      const y = (evento.clientY - area.top) / area.height - 0.5;
      gsap.to(camadaCursor, {
        rotateY: x * 6,
        rotateX: -y * 6,
        x: x * 16,
        y: y * 16,
        duration: 0.6,
        ease: "power2.out",
        transformPerspective: 800,
      });
    }
    // Ao tirar o mouse da seção, tudo volta suavemente ao lugar.
    function aoSairMouse() {
      gsap.to(camadaCursor, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    }
    secao.addEventListener("mousemove", aoMoverMouse);
    secao.addEventListener("mouseleave", aoSairMouse);

    return () => {
      ctx.revert(); // desfaz as animações/ScrollTriggers desta seção
      secao.removeEventListener("mousemove", aoMoverMouse);
      secao.removeEventListener("mouseleave", aoSairMouse);
    };
  }, []);

  return (
    <section
      ref={secaoRef}
      className="relative flex min-h-screen w-full items-end overflow-hidden"
    >
      {/* CAMADA DO CURSOR: recebe a inclinação 3D do mouse. Fica um
          pouco MAIOR que a tela (inset negativo) pra que, ao inclinar,
          as bordas da imagem nunca apareçam. */}
      <div
        ref={camadaCursorRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* CAMADA DO SCROLL: dentro da do cursor, recebe o parallax +
            zoom. A imagem em si cobre tudo (object-cover). Se a notícia
            agregada veio SEM imagem, mostramos um visual reserva: um
            degradê na cor da categoria + o símbolo dela gigante. */}
        <div ref={camadaScrollRef} className="absolute inset-0 will-change-transform">
          {noticia.imagem ? (
            <Image
              src={noticia.imagem}
              alt={noticia.manchete}
              fill
              sizes="100vw"
              quality={90}
              className="object-cover"
              // A primeira notícia carrega com prioridade (aparece cedo);
              // as outras carregam sob demanda (lazy), economizando banda.
              priority={indice === 0}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `radial-gradient(ellipse at 50% 40%, ${cor}22 0%, ${cor}0d 45%, transparent 75%)`,
              }}
            >
              <span
                aria-hidden="true"
                className="font-display select-none text-[22vw] leading-none font-bold tracking-tight md:text-[16vw]"
                style={{
                  color: "transparent",
                  WebkitTextStroke: `1px ${cor}55`,
                }}
              >
                {MARCA_CATEGORIA[noticia.categoria]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Vinheta cinematográfica: escurece as bordas da imagem (foco no
          centro e disfarça compressão de fotos de portal). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Véu escuro pra garantir legibilidade do texto por cima da foto
          (mais forte embaixo, onde fica o texto). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10"
      />

      {/* Número fantasma gigante atrás do texto (só contorno) — mesma
          "assinatura visual" do projeto original. */}
      <span
        aria-hidden="true"
        className="numero-fantasma font-display pointer-events-none absolute -bottom-6 left-2 z-0 text-[9rem] leading-none font-bold md:text-[16rem]"
      >
        {String(indice + 1).padStart(2, "0")}
      </span>

      {/* BLOCO DE TEXTO + INTERAÇÕES, ancorado embaixo. */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pb-16 md:pb-24">
        <div ref={textoRef}>
          {/* Régua + categoria (na cor dela) + data + EM ALTA + fonte */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="h-px w-10" style={{ backgroundColor: cor }} />
            <span
              className="font-telemetry text-xs tracking-[0.25em] uppercase"
              style={{ color: cor }}
            >
              {ROTULO_CATEGORIA[noticia.categoria]}
            </span>
            <span className="font-telemetry text-xs tracking-[0.15em] text-[var(--text-dim)] uppercase">
              {formatarData(noticia.dataISO)}
            </span>
            {/* Escassez/novidade: as 3 primeiras posições do SEU feed
                são o que está bombando — o cérebro adora "agora". */}
            {indice < 3 && (
              <span className="font-telemetry flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] tracking-[0.2em] text-orange-300 uppercase">
                <span className="pulso-sinal inline-block h-1 w-1 rounded-full bg-orange-300" />
                em alta
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl font-bold tracking-[0.01em] text-[var(--text)] drop-shadow-lg md:text-4xl">
            {noticia.manchete}
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-dim)] drop-shadow md:text-lg">
            {noticia.resumo}
          </p>

          {/* Prova social (pessoas aqui agora) + crédito da fonte — o
              crédito com link é o que torna o modelo agregador legal. */}
          <div className="font-telemetry mt-3 flex flex-wrap items-center gap-4 text-[11px] tracking-[0.15em] text-[var(--text-dim)] uppercase">
            <span className="flex items-center gap-1.5">
              <span
                className="pulso-sinal inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: cor }}
              />
              {exploradoresAgora(noticia.slug)} explorando agora
            </span>
            {noticia.fonteNome && noticia.urlFonte && (
              <a
                href={noticia.urlFonte}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto underline-offset-4 transition hover:text-[var(--text)] hover:underline"
              >
                ler na fonte: {noticia.fonteNome} ↗
              </a>
            )}
          </div>
        </div>

        {/* BARRA DE INTERAÇÕES ------------------------------------- */}
        <div className="mt-4 flex items-center gap-2">
          {/* Curtir: alterna cheio/vazio e soma 1 no contador. O `scale`
              no clique dá aquele "pulinho" do coração. */}
          <button
            type="button"
            onClick={aoCurtir}
            aria-pressed={curtiu}
            aria-label={curtiu ? "Descurtir" : "Curtir"}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition active:scale-90 ${
              curtiu
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]"
                : "border-white/15 text-[var(--text-dim)] hover:border-white/40 hover:text-[var(--text)]"
            }`}
          >
            <IconeCoracao
              cheio={curtiu}
              className={curtiu ? "text-[var(--accent)]" : ""}
            />
            <span className="font-telemetry tabular-nums">{curtidas}</span>
          </button>

          {/* Comentar: abre/fecha o campo de comentário logo abaixo. */}
          <button
            type="button"
            onClick={() => setMostrarComentarios((v) => !v)}
            aria-expanded={mostrarComentarios}
            aria-label="Comentar"
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--text-dim)] transition hover:border-white/40 hover:text-[var(--text)] active:scale-90"
          >
            <IconeComentario />
            <span className="hidden sm:inline">Comentar</span>
          </button>

          {/* Salvar: alterna marcado/desmarcado. */}
          <button
            type="button"
            onClick={aoSalvar}
            aria-pressed={salvou}
            aria-label={salvou ? "Remover dos salvos" : "Salvar"}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition active:scale-90 ${
              salvou
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]"
                : "border-white/15 text-[var(--text-dim)] hover:border-white/40 hover:text-[var(--text)]"
            }`}
          >
            <IconeMarcador
              cheio={salvou}
              className={salvou ? "text-[var(--accent)]" : ""}
            />
            <span className="hidden sm:inline">{salvou ? "Salvo" : "Salvar"}</span>
          </button>

          {/* Compartilhar: mostra um "Copiado!" rápido (visual). Se o
              navegador tiver a função nativa de compartilhar, usa ela. */}
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator
                  .share({ title: noticia.manchete, text: noticia.resumo })
                  .catch(() => {});
              }
              setCompartilhou(true);
              window.setTimeout(() => setCompartilhou(false), 1500);
            }}
            aria-label="Compartilhar"
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--text-dim)] transition hover:border-white/40 hover:text-[var(--text)] active:scale-90"
          >
            <IconeCompartilhar />
            <span className="hidden sm:inline">
              {compartilhou ? "Copiado" : "Compartilhar"}
            </span>
          </button>
        </div>

        {/* Painel de comentários (ver / responder / curtir) — abre com
            o botão Comentar. Ver é público; postar/curtir exige login
            (o painel chama aoExigirLogin, que abre o popup do porteiro). */}
        {mostrarComentarios && (
          <PainelComentarios
            noticiaSlug={noticia.slug}
            usuarioId={usuarioId}
            aoExigirLogin={() => setPortao("comentar")}
          />
        )}
      </div>

      {/* PORTÃO (popup gentil): aparece quando alguém sem login tenta
          curtir demais, comentar ou salvar. É "fixed", então cobre a
          tela toda mesmo estando dentro da seção. */}
      {portao && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
          {/* Fundo escurecido — clicar nele fecha o popup. */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setPortao(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[var(--surface)] p-7 text-center">
            <p className="font-display text-lg font-bold text-[var(--text)]">
              {MENSAGEM_PORTAO[portao]}
            </p>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
              Leva dez segundos. O feed passa a ser seu.
            </p>
            <a
              href="/login"
              className="mt-5 block rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-black transition hover:brightness-110"
            >
              Criar conta / Entrar
            </a>
            <button
              type="button"
              onClick={() => setPortao(null)}
              className="mt-2 w-full py-2 text-xs tracking-[0.15em] text-[var(--text-dim)] uppercase transition hover:text-[var(--text)]"
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
