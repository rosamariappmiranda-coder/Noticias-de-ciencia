/**
 * Robô agregador de notícias
 * ---------------------------------------------------------------
 * Busca notícias de fontes brasileiras (feeds RSS, grátis), limpa,
 * categoriza (por palavras-chave) e devolve num formato pronto pra
 * gravar no banco. Modelo AGREGADOR: guardamos manchete + resumo +
 * imagem + LINK pra fonte original (com crédito) — sem copiar a matéria
 * inteira (legal e grátis).
 *
 * Este arquivo é só a "inteligência" (buscar + tratar). Quem chama ele
 * e grava no banco é a rota app/api/robo/route.ts, que a Vercel vai
 * disparar automaticamente uma vez por dia.
 * ---------------------------------------------------------------
 */

export type CategoriaNoticia =
  | "espaço"
  | "tecnologia"
  | "física"
  | "biologia"
  | "ia";

export type ItemAgregado = {
  slug: string;
  categoria: CategoriaNoticia;
  manchete: string;
  resumo: string;
  imagem: string | null;
  url_fonte: string;
  fonte_nome: string;
  data_iso: string; // AAAA-MM-DD
};

type Fonte = {
  url: string;
  fonteNome: string;
  categoriaPadrao: CategoriaNoticia;
};

// Lista de fontes (é só um array — dá pra adicionar/remover fácil).
// Começamos com fontes de tecnologia BR que trazem imagem; o
// categorizador por palavras-chave (abaixo) reclassifica quando a
// matéria é de espaço/IA/física/biologia.
const FONTES: Fonte[] = [
  {
    url: "https://olhardigital.com.br/feed/",
    fonteNome: "Olhar Digital",
    categoriaPadrao: "tecnologia",
  },
  {
    url: "https://canaltech.com.br/rss/",
    fonteNome: "Canaltech",
    categoriaPadrao: "tecnologia",
  },
  {
    url: "https://www.tecmundo.com.br/rss",
    fonteNome: "TecMundo",
    categoriaPadrao: "tecnologia",
  },
  {
    url: "https://g1.globo.com/rss/g1/ciencia-e-saude/",
    fonteNome: "G1 Ciência e Saúde",
    categoriaPadrao: "biologia",
  },
];

// Regras de categorização por palavra-chave (a primeira que bater vence).
const REGRAS: { categoria: CategoriaNoticia; termos: string[] }[] = [
  {
    categoria: "ia",
    termos: [
      "inteligência artificial",
      "machine learning",
      "chatgpt",
      "openai",
      "gemini",
      "modelo de linguagem",
      " ia ",
    ],
  },
  {
    categoria: "espaço",
    termos: [
      "espaço",
      "nasa",
      "planeta",
      "galáxia",
      "estrela",
      "foguete",
      "asteroide",
      "universo",
      "buraco negro",
      "spacex",
      "marte",
      "telescópio",
      "cometa",
      "órbita",
      "astronaut",
    ],
  },
  {
    categoria: "física",
    termos: [
      "física",
      "quântic",
      "partícula",
      "fusão nuclear",
      "laser",
      "energia nuclear",
    ],
  },
  {
    categoria: "biologia",
    termos: [
      "biolog",
      "célula",
      "dna",
      "genétic",
      "espécie",
      "vírus",
      "bactéria",
      "cérebro",
      "vacina",
      "câncer",
      "saúde",
    ],
  },
];

function categorizar(
  texto: string,
  padrao: CategoriaNoticia
): CategoriaNoticia {
  const t = " " + texto.toLowerCase() + " ";
  for (const r of REGRAS) {
    if (r.termos.some((termo) => t.includes(termo))) return r.categoria;
  }
  return padrao;
}

// Limpa texto de RSS: tira CDATA, tags HTML e converte entidades comuns.
function limparTexto(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extrairTag(bloco: string, tag: string): string {
  const m = bloco.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  );
  return m ? limparTexto(m[1]) : "";
}

// Primeira URL de imagem que aparecer dentro do item.
function primeiraImagem(bloco: string): string | null {
  const m = bloco.match(
    /https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/i
  );
  return m ? m[0] : null;
}

// Transforma o título num "slug" (id amigável). Acrescenta um hash curto
// do link pra garantir que seja único.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove os acentos separados pelo NFD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
function hashCurto(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).slice(0, 6);
}

function paraDataISO(pubDate: string): string {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// Busca e trata UMA fonte (nunca quebra o robô todo se uma falhar).
async function buscarFonte(f: Fonte): Promise<ItemAgregado[]> {
  try {
    const resp = await fetch(f.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FeedConhecimento/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return [];
    const xml = await resp.text();

    const partes = xml.split(/<item[\s>]/i).slice(1);
    const itens: ItemAgregado[] = [];
    for (const parte of partes.slice(0, 15)) {
      const bloco = parte.split(/<\/item>/i)[0];
      const manchete = extrairTag(bloco, "title");
      const url_fonte =
        extrairTag(bloco, "link") || extrairTag(bloco, "guid");
      if (!manchete || !url_fonte || !url_fonte.startsWith("http")) continue;

      const resumoBruto = extrairTag(bloco, "description");
      const resumo = (resumoBruto || manchete).slice(0, 280);
      const imagem = primeiraImagem(bloco);
      const data_iso = paraDataISO(extrairTag(bloco, "pubDate"));
      const categoria = categorizar(
        manchete + " " + resumoBruto,
        f.categoriaPadrao
      );
      const slug = `${slugify(manchete)}-${hashCurto(url_fonte)}`;

      itens.push({
        slug,
        categoria,
        manchete,
        resumo,
        imagem,
        url_fonte,
        fonte_nome: f.fonteNome,
        data_iso,
      });
    }
    return itens;
  } catch {
    return [];
  }
}

// Junta todas as fontes e remove repetidas (pelo link e pelo slug).
export async function agregarNoticias(): Promise<ItemAgregado[]> {
  const listas = await Promise.all(FONTES.map(buscarFonte));
  const vistas = new Set<string>();
  const unicas: ItemAgregado[] = [];
  for (const n of listas.flat()) {
    if (vistas.has(n.url_fonte) || vistas.has(n.slug)) continue;
    vistas.add(n.url_fonte);
    vistas.add(n.slug);
    unicas.push(n);
  }
  return unicas;
}
