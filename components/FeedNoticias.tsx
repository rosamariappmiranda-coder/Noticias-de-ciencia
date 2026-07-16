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

import { noticias } from "@/content/noticias";
import NoticiaImersiva from "./NoticiaImersiva";

export default function FeedNoticias({
  usuarioId,
  curtidasSlugs,
  salvosSlugs,
}: {
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
    </div>
  );
}
