/**
 * NewsReel
 * ---------------------------------------------------------------
 * Um "slide" de notícia em tela cheia, estilo Reels/TikTok: a foto
 * da matéria cobre TODA a área do slide, e por cima dela, ancorado
 * embaixo, fica um bloco com régua + categoria + manchete + resumo +
 * data + botão "ENTENDA MAIS ↗".
 *
 * Este componente NÃO define o tamanho do slide (isso é
 * responsabilidade do `<div>` "wrapper" criado pelo ReelsFeed, que já
 * é `h-dvh w-full relative` — este componente só preenche esse espaço
 * com `absolute inset-0` no fundo). Também não precisa de nenhum
 * hook (useState/useEffect): é uma função pura, então pode continuar
 * sendo Server Component — mais leve, sem JavaScript extra enviado
 * pro navegador só por causa deste arquivo.
 *
 * Animação de entrada do texto: em vez de controlar isso aqui com
 * estado do React, usamos só CSS. O ReelsFeed marca o slide ativo com
 * o atributo `data-ativo="true"` no `<div>` wrapper; as regras
 * `[data-ativo="true"] .linha-reel` / `.manchete-reel` / `.regua-reel`
 * / `.midia-reel` (definidas em app/globals.css) fazem cada pedaço do
 * slide (foto, régua, categoria, manchete, resumo, rodapé) entrar em
 * cascata sozinho, sem re-renderizar nada em React. Etapa "Centro de
 * Comando" (docs/ETAPA-HUD-SPEC-AGENTE.md): antes só o bloco de texto
 * inteiro dava um fade único; agora cada linha entra na sua vez.
 * ---------------------------------------------------------------
 */

import Image from "next/image";
import Link from "next/link";
import type { Noticia } from "@/content/noticias";

// Mesma lógica de formatação de data usada em NewsCard.tsx — cada
// arquivo do projeto mantém sua própria cópia pequena dessa função
// (padrão já usado em LaunchFrames/RocketScene) em vez de importar de
// um módulo compartilhado, pra cada componente continuar fácil de ler
// isoladamente.
function formatarData(dataISO: string): string {
  const data = new Date(`${dataISO}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

type NewsReelProps = {
  noticia: Noticia;
  // Posição da notícia dentro do feed (1, 2, 3...) — usada só pro
  // "número fantasma" gigante atrás do texto (ver mais abaixo). Vem
  // do ReelsFeed, que já sabe a ordem de cada notícia em
  // content/noticias.ts.
  numero: number;
  // As duas primeiras notícias do feed usam `priority` no next/image
  // (carregam mais cedo, sem esperar o "lazy loading" padrão) porque
  // é bem provável que a pessoa chegue nelas rapidamente ao rolar.
  // As demais ficam com o carregamento preguiçoso normal do Next.
  prioridade?: boolean;
};

export default function NewsReel({
  noticia,
  numero,
  prioridade = false,
}: NewsReelProps) {
  // "02", "07", "14"... sempre com 2 dígitos, igual ao contador de
  // slides do ReelsFeed — mesma "linguagem visual" de painel em todo
  // o feed.
  const numeroFormatado = String(numero).padStart(2, "0");

  return (
    <>
      {/* Ken Burns: a foto de fundo mora dentro de um `<div>` que só
          serve pra "recortar" (overflow-hidden) o zoom lento da
          imagem — sem esse recorte, a imagem cresceria 8% pra fora
          dos limites do slide e a gente veria as bordas dela. Quem
          escala é o `<div>` FILHO (`.midia-reel`), não a `<Image>`
          diretamente — assim o `fill` do next/image continua medindo
          o slide inteiro (100% x 100%), e é só a aparência dele que
          "respira". */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="midia-reel relative h-full w-full">
          <Image
            src={noticia.imagem}
            alt={noticia.manchete}
            fill
            sizes="100vw"
            priority={prioridade}
            className="object-cover"
          />
        </div>
      </div>

      {/* Véu de contraste: gradiente escuro de baixo pra cima, pra
          garantir que o texto por cima continue legível não importa
          quão clara seja a foto de fundo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10"
      />

      {/* Segundo véu, agora LATERAL (esquerda pra direita): reforça a
          leitura do texto — que fica ancorado à esquerda do bloco —
          e dá uma sensação de profundidade a mais, como se a cena
          tivesse duas fontes de sombra em vez de uma só. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"
      />

      {/* Número fantasma: o índice da notícia, gigante e "vazado"
          (ver `.numero-fantasma` em globals.css), decorando o fundo
          do slide. `aria-hidden` porque é só efeito visual — quem usa
          leitor de tela já ouve a posição da notícia pelo
          `aria-posinset` que o ReelsFeed coloca no `<div>` do slide.
          Fica ANTES do bloco de texto no HTML de propósito: sem
          precisar de nenhum `z-index`, a ordem natural de pintura do
          navegador já deixa ele atrás do conteúdo que vem depois. */}
      <span
        aria-hidden="true"
        className="numero-fantasma font-display pointer-events-none absolute top-[8vh] right-[-2mm] text-[16vh] leading-none select-none opacity-60 sm:top-[10vh] sm:text-[22vh] sm:opacity-80 md:text-[26vh] md:opacity-100"
      >
        {numeroFormatado}
      </span>

      {/* Bloco de texto, ancorado embaixo do slide. O padding inferior
          soma um valor fixo com `env(safe-area-inset-bottom)` — em
          celulares com barra de gestos (ex.: iPhone sem botão físico),
          isso empurra o texto pra cima o suficiente pra não ficar
          escondido atrás da barra. Não leva mais a classe
          `.conteudo-reel` (o fade único saiu) — agora quem anima é
          cada filho direto dele, via `.linha-reel`. */}
      <div className="relative z-10 mx-auto max-w-2xl px-6 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-10 md:pb-12">
        {/* Linha 1 da cascata: a régua que cresce da esquerda pra
            direita antes da categoria aparecer. */}
        <div
          aria-hidden="true"
          className="linha-reel regua-reel mb-3 h-px bg-[var(--accent)]"
        />

        {/* Linha 2: categoria em formato de "tag de instrumento",
            entre colchetes de verdade (são texto, não CSS) — o
            colchete é o que faz ela parecer um rótulo de painel, não
            uma etiqueta de blog. O leve brilho (`text-shadow`) reforça
            o clima de letreiro luminoso. */}
        <span className="linha-reel font-telemetry inline-block text-[11px] tracking-[0.3em] text-[var(--accent)] uppercase [text-shadow:0_0_8px_rgba(91,140,255,0.45)]">
          [ {noticia.categoria} ]
        </span>

        {/* Linha 3: a manchete, com fade+subida (herdado de
            `.linha-reel`) SOMADO ao recorte de `.manchete-reel` — as
            duas classes juntas na mesma tag. */}
        <h2 className="linha-reel manchete-reel font-display mt-3 text-3xl leading-tight font-bold text-balance text-[var(--text)] drop-shadow-lg md:text-5xl">
          {noticia.manchete}
        </h2>

        {/* Linha 4: o resumo. line-clamp-3 corta o texto em no máximo
            3 linhas e completa com "…" — evita que resumos muito
            longos empurrem a data/link pra fora da tela em telas
            pequenas. */}
        <p className="linha-reel mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--text-dim)] md:text-base">
          {noticia.resumo}
        </p>

        {/* Linha 5: rodapé do slide — data + separador + botão
            terminal "ENTENDA MAIS ↗". */}
        <div className="linha-reel mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <time
            dateTime={noticia.dataISO}
            className="font-telemetry text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)]"
          >
            {formatarData(noticia.dataISO)}
          </time>

          <span aria-hidden="true" className="text-[var(--text-dim)]">
            ·
          </span>

          {/* A página /noticia/[slug] ainda não existe — é a próxima
              etapa do projeto. O link já aponta pro lugar certo.
              Botão "terminal": borda fina, fundo transparente em
              repouso; no hover, a borda vira azul, ganha um fundo
              azul bem fraco (10% de opacidade) e a seta anda 2px pra
              frente — feedback claro de "isso é clicável". O padding
              vertical (`py-3.5`) garante uma área de toque confortável
              (mínimo recomendado de 44px de altura) mesmo em celular. */}
          <Link
            href={`/noticia/${noticia.slug}`}
            className="font-telemetry group inline-flex items-center gap-2 border border-white/20 px-4 py-3.5 text-xs tracking-[0.2em] text-[var(--text)] uppercase transition-colors duration-300 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            Entenda mais
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
