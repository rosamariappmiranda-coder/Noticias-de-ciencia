/**
 * Em Alta — os assuntos quentes de ciência e tecnologia
 * ------------------------------------------------------------------
 * De onde vem o dado
 * ------------------------------------------------------------------
 * Do RSS do Google Notícias, nos tópicos CIÊNCIA e TECNOLOGIA do
 * Brasil. É gratuito, público, não precisa de chave de API e devolve
 * ~140 manchetes específicas com fonte e link.
 *
 * POR QUE NÃO O GOOGLE TRENDS (as "buscas mais feitas"):
 * Foi testado. As buscas em alta no Brasil são dominadas por novela,
 * futebol, política e acidente — numa amostra real vieram "preta gil",
 * "br-163", "cygames" e zero itens de ciência. Plugar aquilo aqui
 * encheria o NEXO de assunto que não é seu. O que a leitora quer ver
 * ("o que está bombando em ciência agora") é o que este arquivo
 * entrega; só o rótulo muda: "em alta", não "mais buscado".
 *
 * O PROBLEMA DA CURADORIA
 * O RSS por tópico é generoso demais. Ele classifica como TECNOLOGIA
 * qualquer notícia que cite "drone" — inclusive tragédia de guerra. E
 * como CIÊNCIA, textos de autoajuda com verniz de psicologia. Por isso
 * cada manchete passa por um crivo de pontuação antes de entrar.
 * ------------------------------------------------------------------
 */

export type AssuntoEmAlta = {
  titulo: string; // manchete limpa, sem o " - Fonte" no fim
  fonte: string; // ex.: "G1", "Folha de S.Paulo"
  url: string; // link para a matéria
  categoria: "ciência" | "tecnologia";
  peso: number; // 0 a 1 — governa o tamanho na nuvem
};

// Tópicos do Google Notícias que consultamos.
const TOPICOS = [
  { chave: "SCIENCE", categoria: "ciência" as const },
  { chave: "TECHNOLOGY", categoria: "tecnologia" as const },
];

/**
 * VOCABULÁRIO POSITIVO — o que caracteriza ciência/tech de verdade.
 * Uma manchete precisa acertar pelo menos um destes para entrar.
 * Sem isso, "provérbio chinês sobre resiliência" passaria batido.
 */
const TERMOS_BONS = [
  // ciência dura
  "estudo", "pesquisa", "pesquisadores", "cientistas", "cientista",
  "descoberta", "descobriram", "experimento", "laboratório",
  // espaço
  "nasa", "espaço", "espacial", "planeta", "galáxia", "asteroide",
  "telescópio", "satélite", "foguete", "lua", "marte", "sonda",
  "estrela", "buraco negro", "cometa", "eclipse", "órbita",
  // física / química / energia
  "quântico", "quântica", "física", "átomo", "partícula", "fusão",
  "reator", "nuclear", "energia solar", "supercondutor",
  // bio / saúde
  "vacina", "genética", "genoma", "dna", "célula", "células",
  "câncer", "tratamento", "anticorpo", "espécie", "fóssil",
  "evolução", "microbioma", "proteína", "neurônio", "cérebro",
  // clima / ambiente
  "clima", "climática", "aquecimento", "amazônia", "oceano",
  "el niño", "desmatamento", "carbono", "biodiversidade",
  // geologia / química — faltavam, e cortavam matéria boa por engano
  // (ex.: "cratera de 390 milhões de anos" era rejeitada sem isso)
  "geolog", "cratera", "vulcão", "vulcânica", "terremoto", "tectônic",
  "milhões de anos", "bilhões de anos", "era glacial", "meteorito",
  "químic", "molécula", "composto", "elemento químico", "reação",
  // tecnologia
  "inteligência artificial", "ia ", "chatgpt", "openai", "gemini",
  "algoritmo", "modelo de linguagem", "chip", "processador",
  "semicondutor", "robô", "robótica", "software", "aplicativo",
  "criptografia", "computador", "computação", "startup", "big tech",
  "smartphone", "bateria", "carro autônomo", "realidade virtual",
];

/**
 * VOCABULÁRIO NEGATIVO — o que denuncia que a manchete não é do
 * nosso assunto, mesmo tendo caído no tópico certo. Qualquer acerto
 * aqui elimina a manchete na hora.
 *
 * "morre", "acidente" e "tiroteio" cortam a tragédia que entra por
 * causa de um "drone" citado de passagem. "horóscopo", "signo" e
 * "provérbio" cortam o pseudocientífico.
 */
const TERMOS_RUINS = [
  "morre", "morto", "mortos", "morreu", "assassin", "tiroteio",
  "acidente", "atropel", "esfaque", "preso", "prisão", "tráfico",
  "estupro", "roubo", "furto", "sequestr", "desaparec",
  "horóscopo", "signo", "signos", "tarô", "zodíaco", "provérbio",
  "autoajuda", "personalidade revela", "demonstram", "veja como era",
  "bbb", "novela", "reality", "celebridade", "namorad",
  "futebol", "jogador", "campeonato", "gol ", "escalação",
  "promoção", "cupom", "black friday", "desconto", "oferta",
  "apostas", "loteria", "mega-sena",
  // Guerra e conflito — a diretriz do produto exclui explicitamente.
  // Entram por causa de "drone", "satélite militar", "míssil hipersônico".
  "guerra", "míssil", "mísseis", "bombardei", "ataque a", "tropas",
  "invasão", "ucrânia", "rússia invade", "gaza", "israel bombardeia",
  "morteiro", "exército", "combatentes", "reféns",
  // Política partidária — também excluída. Ciência de política pública
  // (ex.: financiamento de pesquisa) passa; briga partidária não.
  "eleição", "eleições", "presidente lula", "bolsonaro", "deputad",
  "senador", "senado aprova", "câmara aprova", "ministro do stf",
  "partido", "campanha eleitoral", "urna", "impeachment",
];

/**
 * FONTES CONFIÁVEIS — quando a matéria vem de um destes veículos,
 * ela ganha um empurrão na pontuação. É assim que a nuvem tende a
 * mandar a leitora para o jornalismo sério e não para um agregador
 * qualquer que copiou a notícia.
 *
 * Isto atende diretamente ao pedido: clicar leva à fonte mais
 * confiável sobre o assunto.
 */
const FONTES_CONFIAVEIS: Record<string, number> = {
  "folha de s.paulo": 1,
  "g1": 0.95,
  "estadão": 0.95,
  "o globo": 0.9,
  "bbc news brasil": 1,
  "uol": 0.85,
  "agência fapesp": 1,
  "agência brasil": 0.9,
  "revista pesquisa fapesp": 1,
  "nature": 1,
  "scientific american": 1,
  "new scientist": 0.95,
  "olhar digital": 0.75,
  "canaltech": 0.75,
  "tecnoblog": 0.8,
  "tilt": 0.8,
  "galileu": 0.85,
  "superinteressante": 0.8,
  "veja": 0.75,
  "cnn brasil": 0.8,
};

// Quantos assuntos a nuvem exibe. Acima de ~14 ela vira sopa de letras.
const LIMITE_PADRAO = 12;

// De quanto em quanto tempo buscamos de novo (segundos). 30 minutos é
// bom equilíbrio: o painel fica fresco sem martelar o Google a cada
// visita — o Next guarda o resultado em cache nesse intervalo.
const REVALIDAR_A_CADA = 1800;

function normalizar(texto: string): string {
  return texto.toLowerCase();
}

/**
 * O título do Google Notícias vem no formato "Manchete - Veículo".
 * Removemos o sufixo porque o veículo já é exibido separadamente.
 */
function limparTitulo(titulo: string, fonte: string): string {
  const sufixo = ` - ${fonte}`;
  return titulo.endsWith(sufixo)
    ? titulo.slice(0, -sufixo.length).trim()
    : titulo.trim();
}

/**
 * Converte as entidades de XML/HTML (&amp;, &#39;...) em caracteres
 * de verdade. O RSS entrega tudo escapado.
 */
function decodificar(texto: string): string {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&"); // por último, senão desfaz os de cima
}

function extrair(bloco: string, tag: string): string | null {
  const achado = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return achado ? decodificar(achado[1].trim()) : null;
}

/**
 * A PONTUAÇÃO — decide se a manchete entra e quão grande ela fica.
 * Devolve null quando a manchete deve ser descartada.
 */
function pontuar(titulo: string, fonte: string): number | null {
  const texto = normalizar(titulo);

  // Corte 1: qualquer termo proibido elimina na hora.
  if (TERMOS_RUINS.some((ruim) => texto.includes(ruim))) return null;

  // Corte 2: precisa parecer ciência ou tecnologia.
  const acertos = TERMOS_BONS.filter((bom) => texto.includes(bom)).length;
  if (acertos === 0) return null;

  // Corte 3: manchete curta demais costuma ser chamada vazia.
  if (titulo.length < 30) return null;

  // Relevância temática: 2 ou 3 termos já indicam matéria realmente
  // sobre o assunto. Math.min trava em 1 para não premiar demais
  // manchetes que só repetem palavra-chave.
  const relevancia = Math.min(1, acertos / 3);

  // Confiabilidade do veículo. Desconhecido ganha 0.5 — não é punido,
  // mas perde para um veículo de referência.
  const chaveFonte = normalizar(fonte);
  const confianca =
    Object.entries(FONTES_CONFIAVEIS).find(([nome]) =>
      chaveFonte.includes(nome)
    )?.[1] ?? 0.5;

  // Peso final: 60% tema, 40% fonte. O tema pesa mais porque uma
  // matéria excelente num veículo pequeno vale mais que uma matéria
  // fraca num veículo grande.
  return relevancia * 0.6 + confianca * 0.4;
}

/**
 * Busca um tópico do Google Notícias e devolve os assuntos aprovados.
 */
async function buscarTopico(
  chave: string,
  categoria: "ciência" | "tecnologia"
): Promise<AssuntoEmAlta[]> {
  const url =
    `https://news.google.com/rss/headlines/section/topic/${chave}` +
    `?hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  const resposta = await fetch(url, {
    next: { revalidate: REVALIDAR_A_CADA },
    headers: {
      // Sem User-Agent de navegador o Google às vezes devolve vazio.
      "User-Agent":
        "Mozilla/5.0 (compatible; NEXO/1.0; +https://rosamaria.space)",
    },
  });

  if (!resposta.ok) {
    throw new Error(`Google Notícias respondeu ${resposta.status}`);
  }

  const xml = await resposta.text();
  const blocos = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  const assuntos: AssuntoEmAlta[] = [];

  for (const bloco of blocos) {
    const tituloBruto = extrair(bloco, "title");
    const link = extrair(bloco, "link");
    const fonte = extrair(bloco, "source");

    if (!tituloBruto || !link || !fonte) continue;

    const titulo = limparTitulo(tituloBruto, fonte);
    const peso = pontuar(titulo, fonte);

    if (peso === null) continue;

    assuntos.push({ titulo, fonte, url: link, categoria, peso });
  }

  return assuntos;
}

/**
 * Remove manchetes que contam a MESMA história. Vários veículos
 * cobrem o mesmo fato, e a nuvem ficaria repetitiva.
 *
 * O método: comparar as palavras significativas de cada manchete.
 * Se duas compartilham mais de 60% das palavras, é a mesma história —
 * fica a de maior pontuação (ou seja, a da fonte mais confiável).
 */
function removerRepetidas(assuntos: AssuntoEmAlta[]): AssuntoEmAlta[] {
  const palavrasDe = (t: string) =>
    new Set(
      normalizar(t)
        .replace(/[^\wà-ú\s]/g, " ")
        .split(/\s+/)
        .filter((p) => p.length > 4) // ignora "de", "para", "com"...
    );

  const mantidos: { assunto: AssuntoEmAlta; palavras: Set<string> }[] = [];

  // Ordena por peso primeiro: assim, ao encontrar uma repetição,
  // a que já está na lista é sempre a melhor.
  for (const assunto of [...assuntos].sort((a, b) => b.peso - a.peso)) {
    const palavras = palavrasDe(assunto.titulo);

    const jaExiste = mantidos.some(({ palavras: outras }) => {
      const comuns = [...palavras].filter((p) => outras.has(p)).length;
      const menor = Math.min(palavras.size, outras.size);
      return menor > 0 && comuns / menor > 0.6;
    });

    if (!jaExiste) mantidos.push({ assunto, palavras });
  }

  return mantidos.map((m) => m.assunto);
}

/**
 * A função que a página chama.
 *
 * Nunca lança erro: se o Google estiver fora do ar, devolve lista
 * vazia e a cena simplesmente não aparece. Mesma filosofia da
 * blindagem do Supabase na home — um serviço externo cair não pode
 * derrubar o site inteiro.
 */
export async function buscarEmAlta(
  limite = LIMITE_PADRAO
): Promise<AssuntoEmAlta[]> {
  try {
    // Promise.all busca os dois tópicos EM PARALELO. Um depois do
    // outro levaria o dobro do tempo sem nenhum ganho.
    const listas = await Promise.all(
      TOPICOS.map(({ chave, categoria }) => buscarTopico(chave, categoria))
    );

    const todos = removerRepetidas(listas.flat());

    return todos.sort((a, b) => b.peso - a.peso).slice(0, limite);
  } catch (erro) {
    console.error("Em Alta: falha ao consultar o Google Notícias:", erro);
    return [];
  }
}
