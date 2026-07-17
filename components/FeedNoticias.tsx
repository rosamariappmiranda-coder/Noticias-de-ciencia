/**
 * FeedNoticias
 * ---------------------------------------------------------------
 * O feed em si: pega a lista de notícias (de content/noticias.ts) e
 * desenha UMA NoticiaImersiva pra cada uma, empilhadas verticalmente.
 * Como cada NoticiaImersiva ocupa ~1 tela, o feed inteiro vira uma
 * sequência rolável de "reels", logo abaixo do hero do foguete.
 *
 * Não é "use client": este componente só monta a lista (não usa
 * estado nem eventos do navegador). Quem precisa do navegador é a
 * NoticiaImersiva, que já é "use client" por conta própria.
 * ---------------------------------------------------------------
 */

import type { NoticiaFeed } from "@/lib/tipos-feed";
import NoticiaImersiva from "./NoticiaImersiva";

export default function FeedNoticias({
  noticias,
  usuarioId,
  curtidasSlugs,
  salvosSlugs,
}: {
  noticias: NoticiaFeed[]; // já vem ORDENADO pelo algoritmo (ver app/page.tsx)
  usuarioId: string | null;
  curtidasSlugs: string[]; // slugs que o usuário já curtiu
  salvosSlugs: string[]; // slugs que o usuário já salvou
}) {
  return (
    <div className="relative z-10">
      {noticias.map((noticia, indice) => (
        // `key` ajuda o React a identificar cada item da lista; usamos
        // o `slug`, que é único por notícia. Passamos pra cada notícia se
        // o usuário logado já a curtiu/salvou, pros botões nascerem certos.
        <NoticiaImersiva
          key={noticia.slug}
          noticia={noticia}
          indice={indice}
          usuarioId={usuarioId}
          curtidaInicial={curtidasSlugs.includes(noticia.slug)}
          salvoInicial={salvosSlugs.includes(noticia.slug)}
        />
      ))}

      {/* FIM DO FEED — fechamento com gancho de retorno (efeito
          "Zeigarnik": lembrar a pessoa de que amanhã tem mais mantém a
          história em aberto na cabeça dela). */}
      <section className="relative flex min-h-[70vh] w-full flex-col items-center justify-center px-6 text-center">
        <p className="font-telemetry text-xs tracking-[0.35em] text-[var(--accent)] uppercase">
          transmissão de hoje encerrada
        </p>
        <h2 className="font-display mt-4 max-w-xl text-3xl font-bold text-[var(--text)] md:text-5xl">
          Você zerou o feed. O universo, não.
        </h2>
        <p className="mt-4 max-w-md text-base text-[var(--text-dim)]">
          Amanhã tem descoberta nova, tendência nova e polêmica nova.
          A ciência não dorme — e o seu feed também não.
        </p>
        <a
          href="#topo"
          className="botao-gradiente font-telemetry mt-8 rounded-full px-7 py-3 text-xs tracking-[0.25em] uppercase"
        >
          decolar de novo
        </a>
      </section>
    </div>
  );
}
