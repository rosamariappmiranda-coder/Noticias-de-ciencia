/**
 * NewsReel
 * ---------------------------------------------------------------
 * Um "slide" de notícia em tela cheia, estilo Reels/TikTok: a foto
 * da matéria cobre TODA a área do slide, e por cima dela, ancorado
 * embaixo, fica um bloco com categoria + manchete + resumo + data +
 * link "Entenda mais →".
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
 * o atributo `data-ativo="true"` no `<div>` wrapper; a regra
 * `[data-ativo="true"] .conteudo-reel` (definida em app/globals.css)
 * faz o bloco de texto (classe `.conteudo-reel`) entrar com fade +
 * leve subida sozinho, sem re-renderizar nada em React.
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
  // As duas primeiras notícias do feed usam `priority` no next/image
  // (carregam mais cedo, sem esperar o "lazy loading" padrão) porque
  // é bem provável que a pessoa chegue nelas rapidamente ao rolar.
  // As demais ficam com o carregamento preguiçoso normal do Next.
  prioridade?: boolean;
};

export default function NewsReel({ noticia, prioridade = false }: NewsReelProps) {
  return (
    <>
      {/* Imagem de fundo cobrindo o slide inteiro. `fill` faz a
          imagem ocupar 100% do elemento pai mais próximo com
          posicionamento definido — no caso, o `<div>` wrapper
          `relative h-dvh w-full` criado pelo ReelsFeed. */}
      <Image
        src={noticia.imagem}
        alt={noticia.manchete}
        fill
        sizes="100vw"
        priority={prioridade}
        className="object-cover"
      />

      {/* Véu de contraste: gradiente escuro de baixo pra cima, pra
          garantir que o texto por cima continue legível não importa
          quão clara seja a foto de fundo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10"
      />

      {/* Bloco de texto, ancorado embaixo do slide. O padding inferior
          soma um valor fixo com `env(safe-area-inset-bottom)` — em
          celulares com barra de gestos (ex.: iPhone sem botão físico),
          isso empurra o texto pra cima o suficiente pra não ficar
          escondido atrás da barra. */}
      <div
        className="conteudo-reel absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-6 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-10 md:pb-12"
      >
        <span className="font-telemetry text-[11px] uppercase tracking-[0.3em] text-[var(--accent)]">
          {noticia.categoria}
        </span>

        <h2 className="font-display mt-3 text-3xl leading-tight font-bold text-balance text-[var(--text)] drop-shadow-lg md:text-5xl">
          {noticia.manchete}
        </h2>

        {/* line-clamp-3: corta o texto em no máximo 3 linhas e
            completa com "…" — evita que resumos muito longos empurrem
            a data/link pra fora da tela em telas pequenas. */}
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--text-dim)] md:text-base">
          {noticia.resumo}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <time
            dateTime={noticia.dataISO}
            className="font-telemetry text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)]"
          >
            {formatarData(noticia.dataISO)}
          </time>

          {/* A página /noticia/[slug] ainda não existe — é a próxima
              etapa do projeto. O link já aponta pro lugar certo. */}
          <Link
            href={`/noticia/${noticia.slug}`}
            className="font-telemetry text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition-transform duration-300 hover:translate-x-1"
          >
            Entenda mais →
          </Link>
        </div>
      </div>
    </>
  );
}
