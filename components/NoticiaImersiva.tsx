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
import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Noticia } from "@/content/noticias";
import { criarClienteNavegador } from "@/lib/supabase/client";

gsap.registerPlugin(ScrollTrigger);

// Rótulo bonito (em CAIXA ALTA) mostrado pra cada categoria. Fica num
// objeto separado pra ser fácil de ler e trocar depois.
const ROTULO_CATEGORIA: Record<Noticia["categoria"], string> = {
  espaço: "Espaço",
  tecnologia: "Tecnologia",
  física: "Física",
  biologia: "Biologia",
  ia: "Inteligência Artificial",
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
  curtir: "Você curtiu bastante! 🌟 Crie uma conta pra continuar curtindo.",
  comentar: "Pra comentar, crie sua conta.",
  salvar: "Pra salvar e ler depois, crie sua conta.",
};

export default function NoticiaImersiva({
  noticia,
  indice,
  usuarioId,
  curtidaInicial,
  salvoInicial,
}: {
  noticia: Noticia;
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
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [comentarioEnviado, setComentarioEnviado] = useState(false);
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

  // --- COMENTAR (abrir/fechar o campo; exige login) ---
  function aoClicarComentar() {
    if (!usuarioId) {
      setPortao("comentar");
      return;
    }
    setMostrarComentario((v) => !v);
  }

  // --- ENVIAR COMENTÁRIO (grava de verdade na tabela) ---
  async function aoEnviarComentario(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!usuarioId) {
      setPortao("comentar");
      return;
    }
    const campo = e.currentTarget.elements.namedItem(
      "comentario"
    ) as HTMLInputElement | null;
    const texto = campo?.value.trim() ?? "";
    if (!texto) {
      setMostrarComentario(false);
      return;
    }
    const supabase = supabaseRef.current!;
    const { error } = await supabase.from("interacoes").insert({
      user_id: usuarioId,
      noticia_slug: noticia.slug,
      categoria: noticia.categoria,
      tipo: "comentario",
      texto,
    });
    setMostrarComentario(false);
    if (error) {
      console.error("Erro ao comentar:", error.message);
      return;
    }
    setComentarioEnviado(true);
    window.setTimeout(() => setComentarioEnviado(false), 2500);
  }

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
        { yPercent: -8, scale: 1.18 },
        {
          yPercent: 8,
          scale: 1.06,
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
            zoom. A imagem em si cobre tudo (object-cover). */}
        <div ref={camadaScrollRef} className="absolute inset-0 will-change-transform">
          <Image
            src={noticia.imagem}
            alt={noticia.manchete}
            fill
            sizes="100vw"
            className="object-cover"
            // A primeira notícia carrega com prioridade (aparece cedo);
            // as outras carregam sob demanda (lazy), economizando banda.
            priority={indice === 0}
          />
        </div>
      </div>

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
          {/* Régua + categoria + data */}
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--accent)]" />
            <span className="font-telemetry text-xs tracking-[0.25em] text-[var(--accent)] uppercase">
              {ROTULO_CATEGORIA[noticia.categoria]}
            </span>
            <span className="font-telemetry text-xs tracking-[0.15em] text-[var(--text-dim)] uppercase">
              {formatarData(noticia.dataISO)}
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-[0.01em] text-[var(--text)] drop-shadow-lg md:text-4xl">
            {noticia.manchete}
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-dim)] drop-shadow md:text-lg">
            {noticia.resumo}
          </p>
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
            <span className="text-base">{curtiu ? "❤️" : "🤍"}</span>
            <span className="font-telemetry tabular-nums">{curtidas}</span>
          </button>

          {/* Comentar: abre/fecha o campo de comentário logo abaixo. */}
          <button
            type="button"
            onClick={aoClicarComentar}
            aria-expanded={mostrarComentario}
            aria-label="Comentar"
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--text-dim)] transition hover:border-white/40 hover:text-[var(--text)] active:scale-90"
          >
            <span className="text-base">💬</span>
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
            <span className="text-base">{salvou ? "🔖" : "🏷️"}</span>
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
            <span className="text-base">↗️</span>
            <span className="hidden sm:inline">
              {compartilhou ? "Copiado!" : "Compartilhar"}
            </span>
          </button>
        </div>

        {/* Aviso rápido quando um comentário é salvo com sucesso. */}
        {comentarioEnviado && (
          <p className="font-telemetry text-xs tracking-[0.15em] text-[var(--accent)] uppercase">
            Comentário enviado! 💬
          </p>
        )}

        {/* Campo de comentário (aparece só quando o botão é clicado, e
            só pra quem está logado). Ao enviar, grava de verdade na
            tabela interacoes. */}
        {mostrarComentario && (
          <form
            onSubmit={aoEnviarComentario}
            className="mt-1 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm sm:flex-row"
          >
            <input
              name="comentario"
              type="text"
              placeholder="Escreva um comentário…"
              className="font-body flex-1 rounded-full bg-white/5 px-4 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:bg-white/10"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-black transition active:scale-90"
            >
              Enviar
            </button>
          </form>
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
              Leva 10 segundos e o seu feed fica só do seu jeito. ✨
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
