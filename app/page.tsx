import StarField from "@/components/StarField";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import HeroHelix from "@/components/HeroHelix";
import FeedNoticias from "@/components/FeedNoticias";
import BarraProgresso from "@/components/BarraProgresso";
import FundoAurora from "@/components/FundoAurora";
import RadarTendencias from "@/components/RadarTendencias";
import { extrairTendencias } from "@/lib/tendencias";
import { criarClienteServidor } from "@/lib/supabase/server";
import { noticias } from "@/content/noticias";
import { ordenarFeed, type SinalInteracao } from "@/lib/algoritmo-feed";
import type { NoticiaFeed } from "@/lib/tipos-feed";
import type { Categoria } from "@/content/noticias";

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
  // BLINDAGEM: toda a leitura do Supabase abaixo vai dentro de try/catch.
  // Se as chaves de ambiente faltarem ou o banco estiver fora do ar, a
  // home NÃO pode estourar erro 500 — ela cai pras notícias fixas e trata
  // a pessoa como visitante deslogado. O feed é público, então funciona.
  let user: { id: string; email?: string | null } | null = null;
  let agregadas: NoticiaFeed[] = [];

  try {
    // Descobre quem está logado e busca as notícias do BANCO (agregadas
    // pelo robô, frescas da web) — tudo no servidor, protegido pela RLS.
    const supabase = await criarClienteServidor();
    user = (await supabase.auth.getUser()).data.user;

    const { data: doBanco } = await supabase
      .from("noticias")
      .select("slug, categoria, manchete, resumo, imagem, url_fonte, fonte_nome, data_iso")
      .order("data_iso", { ascending: false })
      .limit(120);

    agregadas = (doBanco ?? []).map((n) => ({
      slug: n.slug,
      categoria: n.categoria as Categoria,
      manchete: n.manchete,
      resumo: n.resumo,
      imagem: n.imagem,
      dataISO: n.data_iso,
      fonteNome: n.fonte_nome,
      urlFonte: n.url_fonte,
    }));
  } catch (erro) {
    console.error("Home: falha ao carregar do Supabase, usando só notícias fixas:", erro);
  }

  // ------------------------------------------------------------
  // MONTA O CARDÁPIO DO FEED: notícias do banco (se vieram) + as
  // escritas à mão (content/noticias.ts, sempre disponíveis).
  // ------------------------------------------------------------
  const escritas: NoticiaFeed[] = noticias.map((n) => ({
    slug: n.slug,
    categoria: n.categoria,
    manchete: n.manchete,
    resumo: n.resumo,
    imagem: n.imagem,
    dataISO: n.dataISO,
    fonteNome: null,
    urlFonte: null,
  }));

  // Junta as duas origens sem repetir slug.
  const slugsVistos = new Set<string>();
  const cardapio: NoticiaFeed[] = [];
  for (const n of [...agregadas, ...escritas]) {
    if (slugsVistos.has(n.slug)) continue;
    slugsVistos.add(n.slug);
    cardapio.push(n);
  }

  const curtidasSlugs: string[] = [];
  const salvosSlugs: string[] = [];
  const sinais: SinalInteracao[] = []; // "combustível" do algoritmo

  // ------------------------------------------------------------
  // CONTAGEM REAL de curtidas por notícia (para TODO mundo, logado
  // ou não). Vem da visão `curtidas_por_noticia`, que devolve só
  // slug + total — nunca quem curtiu.
  //
  // Precisa ser uma visão porque a política de segurança da tabela
  // `interacoes` deixa cada pessoa ver apenas as próprias linhas.
  // Consultar a tabela direto daqui traria só as curtidas de quem
  // está logado, e zero para visitante.
  // ------------------------------------------------------------
  const curtidasPorSlug: Record<string, number> = {};

  try {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from("curtidas_por_noticia")
      .select("noticia_slug, total");

    for (const linha of data ?? []) {
      curtidasPorSlug[linha.noticia_slug] = linha.total;
    }
  } catch (erro) {
    // Blindagem: sem contagem o feed simplesmente não mostra número.
    // Melhor um card sem contador do que a home inteira fora do ar.
    console.error("Home: falha ao contar curtidas:", erro);
  }

  if (user) {
    try {
      const supabase = await criarClienteServidor();

      // Curtidas, salvos e VISUALIZAÇÕES (tempo de atenção): viram
      // estado inicial dos botões e sinais do algoritmo.
      const { data: inter } = await supabase
        .from("interacoes")
        .select("noticia_slug, categoria, tipo, created_at")
        .eq("user_id", user.id)
        .in("tipo", ["curtida", "salvo", "visualizacao"]);
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
      const categoriaPorSlug = new Map(cardapio.map((n) => [n.slug, n.categoria]));
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
    } catch (erro) {
      console.error("Home: falha ao carregar sinais do usuário:", erro);
    }
  }

  // O ALGORITMO ordena o feed pra ESTE usuário (sem sinais, cai no
  // frescor — mais recentes primeiro).
  const feedOrdenado = ordenarFeed(cardapio, sinais);

  // O RADAR: assuntos mais cobertos pelas fontes agregadas agora.
  const tendencias = extrairTendencias(cardapio);

  return (
    <SmoothScrollProvider>
      {/* Âncora do topo (o botão "decolar de novo" do fim do feed
          aponta pra cá). */}
      <span id="topo" />

      {/* Linha de progresso da leitura, fixa no topo. */}
      <BarraProgresso />

      {/* Céu de estrelas fixo, atrás de tudo. É ele que "aparece"
          quando o canvas do foguete se dissolve. */}
      <StarField />

      {/* Aurora: manchas de cor desfocadas respirando atrás do
          conteúdo — profundidade premium, sem distrair. */}
      <FundoAurora />

      {/* O hero: o foguete tocando pelo scroll e, no fim, sumindo pra
          revelar o feed diretamente. */}
      <HeroHelix />

      {/* O radar: ranking do que está sendo mais coberto agora, com os
          portais que estão falando de cada assunto. */}
      <RadarTendencias tendencias={tendencias} />

      {/* O feed de notícias (já ordenado pelo algoritmo) abaixo do hero. */}
      <FeedNoticias
        noticias={feedOrdenado}
        usuarioId={user?.id ?? null}
        curtidasSlugs={curtidasSlugs}
        salvosSlugs={salvosSlugs}
        curtidasPorSlug={curtidasPorSlug}
      />
    </SmoothScrollProvider>
  );
}
