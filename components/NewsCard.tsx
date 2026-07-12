/**
 * NewsCard
 * ---------------------------------------------------------------
 * Um cartão de notícia individual: imagem de capa, categoria,
 * manchete, resumo, data e um link "Entenda mais →" que leva pra
 * página completa da matéria (/noticia/[slug] — essa página ainda
 * não existe, é a próxima etapa do projeto, mas o link já aponta
 * pra lá).
 *
 * Não é "use client": este componente não usa nenhum hook (useState,
 * useEffect etc.), então pode continuar sendo Server Component —
 * quem cuida da animação de entrada é o NewsFeed (o componente pai),
 * que aplica o GSAP de fora pra dentro via uma ref no elemento raiz.
 * ---------------------------------------------------------------
 */

import Image from "next/image";
import Link from "next/link";
import type { Noticia } from "@/content/noticias";

// Formata "2026-06-18" como "18 de junho de 2026", já em português
// do Brasil — o navegador/Node cuida da tradução dos nomes dos
// meses, a gente só pede o formato "por extenso" (long).
function formatarData(dataISO: string): string {
  const data = new Date(`${dataISO}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

type NewsCardProps = {
  noticia: Noticia;
  // Passado pelo NewsFeed pra ele conseguir "pegar" este elemento
  // DOM e animar a entrada dele com GSAP.
  cardRef?: (elemento: HTMLElement | null) => void;
};

export default function NewsCard({ noticia, cardRef }: NewsCardProps) {
  return (
    <Link
      ref={cardRef}
      href={`/noticia/${noticia.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-white/20 hover:shadow-[0_0_50px_rgba(91,140,255,0.18)]"
    >
      {/* Imagem de capa — next/image otimiza o arquivo (redimensiona,
          comprime, serve no formato certo pro navegador) e o "sizes"
          avisa o navegador quanto espaço a imagem vai ocupar na
          tela, pra ele baixar só o tamanho necessário. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={noticia.imagem}
          alt={noticia.manchete}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Véu escuro sutil por cima da imagem, pra garantir contraste
            se algum dia colocarmos texto sobreposto e pra unificar o
            clima visual com o resto do site. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--surface)]/40 via-transparent to-transparent" />
      </div>

      <div className="p-6">
        <span className="font-telemetry text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
          {noticia.categoria}
        </span>

        <h3 className="font-display mt-3 text-xl font-semibold leading-snug text-[var(--text)] md:text-2xl">
          {noticia.manchete}
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
          {noticia.resumo}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <time
            dateTime={noticia.dataISO}
            className="font-telemetry text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)]"
          >
            {formatarData(noticia.dataISO)}
          </time>

          <span className="font-telemetry text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1">
            Entenda mais →
          </span>
        </div>
      </div>
    </Link>
  );
}
