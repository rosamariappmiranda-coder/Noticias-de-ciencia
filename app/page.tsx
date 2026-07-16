import StarField from "@/components/StarField";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import HeroHelix from "@/components/HeroHelix";
import FeedNoticias from "@/components/FeedNoticias";
import { criarClienteServidor } from "@/lib/supabase/server";
import { noticias } from "@/content/noticias";
import { ordenarFeed, type SinalInteracao } from "@/lib/algoritmo-feed";

// Cópia "Hero Helix" (12/07/2026): efeito estilo helixearth.com numa
// porta separada (:3005), sem tocar no projeto original (:3002).
//
//   StarField (fundo fixo, z-0)
//     → HeroHelix (o foguete arrastado pelo scroll + dissolução)
//       → FeedNoticias (as 12 notícias como "reels" imersivos,
//          com imagem animada no scroll — peça 1 da plataforma).
//
// SmoothScrollProvider religa o Lenis (scroll suave) que o projeto
// original desativou ao virar feed Reels — aqui ele é essencial.
export default async function Home() {
  // Descobre quem está logado e quais notícias essa pessoa já curtiu/
  // salvou — tudo no servidor, protegido pela segurança RLS. Assim o
  // feed já vem com os botões no estado certo, sem "piscar".
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curtidasSlugs: string[] = [];
  const salvosSlugs: string[] = [];
  const sinais: SinalInteracao[] = []; // "combustível" do algoritmo

  if (user) {
    // Curtidas e salvos: viram estado inicial dos botões E sinais do
    // algoritmo (com categoria e data).
    const { data: inter } = await supabase
      .from("interacoes")
      .select("noticia_slug, categoria, tipo, created_at")
      .eq("user_id", user.id)
      .in("tipo", ["curtida", "salvo"]);
    for (const linha of inter ?? []) {
      if (linha.tipo === "curtida") curtidasSlugs.push(linha.noticia_slug);
      else if (linha.tipo === "salvo") salvosSlugs.push(linha.noticia_slug);
      sinais.push({
        categoria: linha.categoria,
        tipo: linha.tipo,
        quando: linha.created_at,
      });
    }

    // Comentários também são sinais (fortes) de interesse. A categoria
    // vem da própria notícia comentada.
    const categoriaPorSlug = new Map(
      noticias.map((n) => [n.slug, n.categoria])
    );
    const { data: coms } = await supabase
      .from("comentarios")
      .select("noticia_slug, created_at")
      .eq("user_id", user.id);
    for (const c of coms ?? []) {
      const categoria = categoriaPorSlug.get(c.noticia_slug);
      if (categoria) {
        sinais.push({ categoria, tipo: "comentario", quando: c.created_at });
      }
    }
  }

  // O ALGORITMO ordena o feed pra ESTE usuário (sem sinais, cai no
  // frescor — mais recentes primeiro).
  const feedOrdenado = ordenarFeed(noticias, sinais);

  return (
    <SmoothScrollProvider>
      {/* Céu de estrelas fixo, atrás de tudo. É ele que "aparece"
          quando o canvas do foguete se dissolve. */}
      <StarField />

      {/* O hero: o foguete tocando pelo scroll e, no fim, sumindo pra
          revelar o feed diretamente. */}
      <HeroHelix />

      {/* O feed de notícias (já ordenado pelo algoritmo) abaixo do hero. */}
      <FeedNoticias
        noticias={feedOrdenado}
        usuarioId={user?.id ?? null}
        curtidasSlugs={curtidasSlugs}
        salvosSlugs={salvosSlugs}
      />
    </SmoothScrollProvider>
  );
}
