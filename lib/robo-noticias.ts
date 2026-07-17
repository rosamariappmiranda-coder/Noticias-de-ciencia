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
// Os termos são casados por FRONTEIRA de palavra (não por substring) —
// senão "estrelada" (filme) casaria com "estrela" e viraria "espaço".
const REGRAS: { categoria: CategoriaNoticia; termos: string[] }[] = [
  {
    categoria: "ia",
    termos: [
      "inteligência artificial",
      "machine learning",
      "chatgpt",
      "openai",
      "anthropic",
      "gemini",
      "modelo de linguagem",
      "ia",
      "deepfake",
    ],
  },
  {
    categoria: "espaço",
    termos: [
      "nasa",
      "planeta",
      "exoplaneta",
      "galáxia",
      "estrelas",
      "foguete",
      "asteroide",
      "universo",
      "buraco negro",
      "spacex",
      "starship",
      "marte",
      "telescópio",
      "cometa",
      "órbita",
      "astronauta",
      "espacial",
      "anos-luz",
    ],
  },
  {
    categoria: "física",
    termos: [
      "quântico",
      "quântica",
      "partícula",
      "partículas",
      "fusão nuclear",
      "energia nuclear",
      "reator",
      "colisor",
      "cern",
      "síncrotron",
    ],
  },
  {
    categoria: "biologia",
    termos: [
      "biologia",
      "célula",
      "células",
      "dna",
      "genética",
      "genético",
      "espécie",
      "vírus",
      "bactéria",
      "bactérias",
      "cérebro",
      "vacina",
      "câncer",
      "fóssil",
      "neurociência",
    ],
  },
];

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Testa o termo com "fronteiras" (início/fim ou caractere não-letra dos
// dois lados) — o \b do JavaScript não entende acentos, então fazemos o
// nosso: [^a-zà-ú0-9] como fronteira.
function contemTermo(texto: string, termo: string): boolean {
  const re = new RegExp(
    `(^|[^a-zà-ú0-9])${escaparRegex(termo)}([^a-zà-ú0-9]|$)`,
    "i"
  );
  return re.test(texto);
}

function categorizar(
  texto: string,
  padrao: CategoriaNoticia
): CategoriaNoticia {
  const t = texto.toLowerCase();
  for (const r of REGRAS) {
    if (r.termos.some((termo) => contemTermo(t, termo))) return r.categoria;
  }
  return padrao;
}

// FILTRO DE QUALIDADE: os feeds de tech BR misturam loteria, promoção
// de produto, horóscopo etc. Nada disso é ciência/tecnologia de
// verdade — se a manchete/resumo contém um destes termos, descartamos.
const TERMOS_BLOQUEADOS = [
  // loteria / azar
  "mega-sena",
  "lotofácil",
  "lotofacil",
  "quina de hoje",
  "loteria",
  "+milionária",
  "milionária de hoje",
  "horóscopo",
  "signo",
  "palpite",
  // varejo / promoção
  "promoção",
  "desconto",
  "cupom",
  "oferta",
  "mais barato",
  "vale a pena comprar",
  "no precinho",
  "tabela fipe",
  "melhores celulares",
  "review:",
  // entretenimento (filmes/séries não são ciência)
  "netflix",
  "apple tv",
  "prime video",
  "globoplay",
  "série",
  "filme",
  "temporada",
  "trailer",
  "reboot",
  "estreia",
  "super-herói",
  "marvel",
  "dc comics",
  "onde assistir",
  "na íntegra",
  // esporte
  "copa do mundo",
  "futebol",
];

// Notícia velha não é "tendência": descartamos o que tem mais de 120
// dias (alguns feeds devolvem posts antigos misturados).
const IDADE_MAXIMA_DIAS = 120;

function aindaFresca(dataISO: string): boolean {
  const dias =
    (Date.now() - new Date(dataISO + "T00:00:00").getTime()) / 86_400_000;
  return dias <= IDADE_MAXIMA_DIAS;
}

function passaNoFiltro(texto: string): boolean {
  const t = texto.toLowerCase();
  return !TERMOS_BLOQUEADOS.some((termo) => t.includes(termo));
}

// Tira o rodapé de spam que alguns feeds colam no resumo
// ("O post X apareceu primeiro em Y.") e corta em 280 caracteres.
function limparResumo(s: string): string {
  return s
    .replace(/O post .{0,200}? apareceu primeiro em .*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

// Tabela de entidades HTML → caractere (os feeds BR usam muito
// &eacute;, &atilde; etc. pra acentos).
const ENTIDADES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  aacute: "á", agrave: "à", acirc: "â", atilde: "ã", auml: "ä",
  eacute: "é", egrave: "è", ecirc: "ê",
  iacute: "í", icirc: "î",
  oacute: "ó", ocirc: "ô", otilde: "õ",
  uacute: "ú", ucirc: "û", uuml: "ü",
  ccedil: "ç",
  Aacute: "Á", Atilde: "Ã", Eacute: "É", Ecirc: "Ê",
  Iacute: "Í", Oacute: "Ó", Otilde: "Õ", Uacute: "Ú", Ccedil: "Ç",
  ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'",
  mdash: "—", ndash: "–", hellip: "…",
};

// Limpa texto de RSS: tira CDATA, tags HTML e converte entidades
// (nomeadas, decimais &#233; e hexadecimais &#xE9;).
function limparTexto(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-zA-Z]+);/g, (m, nome) => ENTIDADES[nome] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
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

      // Curadoria: pula loteria/promoção/etc (ver TERMOS_BLOQUEADOS).
      if (!passaNoFiltro(manchete + " " + resumoBruto)) continue;

      const resumo = limparResumo(resumoBruto) || manchete;
      const imagem = primeiraImagem(bloco);
      const data_iso = paraDataISO(extrairTag(bloco, "pubDate"));

      // Curadoria: notícia velha não entra num feed de tendências.
      if (!aindaFresca(data_iso)) continue;
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
