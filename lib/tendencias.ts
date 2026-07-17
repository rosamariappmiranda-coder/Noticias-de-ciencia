/**
 * Radar de tendências
 * ---------------------------------------------------------------
 * Varre as notícias agregadas e descobre QUAIS ASSUNTOS estão sendo
 * mais cobertos AGORA — e por quais portais. É o nosso "mais buscados
 * da web": derivado de dados reais (a cobertura da imprensa de
 * ciência/tech), não inventado.
 *
 * Como funciona: temos um dicionário de entidades conhecidas (IA,
 * SpaceX, Google, James Webb...). Contamos quantas notícias mencionam
 * cada uma (por fronteira de palavra) e juntamos os portais que
 * cobriram. As mais mencionadas viram o ranking.
 * ---------------------------------------------------------------
 */

import type { Categoria } from "@/content/noticias";
import type { NoticiaFeed } from "@/lib/tipos-feed";

export type Tendencia = {
  termo: string;
  categoria: Categoria;
  mencoes: number;
  portais: string[]; // fontes distintas cobrindo o assunto
};

// Entidades rastreadas: [termo exibido, termos de busca, categoria]
const ENTIDADES: [string, string[], Categoria][] = [
  ["Inteligência Artificial", ["ia", "inteligência artificial", "chatgpt", "openai", "gemini", "deepfake", "machine learning"], "ia"],
  ["SpaceX · Starship", ["spacex", "starship"], "espaço"],
  ["Lua · Artemis", ["lua", "artemis", "lunar"], "espaço"],
  ["James Webb", ["james webb", "jwst"], "espaço"],
  ["Marte", ["marte", "marciano", "marciana"], "espaço"],
  ["Galáxias", ["galáxia", "galáxias", "matéria escura"], "espaço"],
  ["Google", ["google", "gmail", "youtube"], "tecnologia"],
  ["Computação Quântica", ["quântica", "quântico", "qubit"], "física"],
  ["Energia Nuclear", ["nuclear", "reator", "reatores", "fusão"], "física"],
  ["Genética & Saúde", ["dna", "genética", "genético", "câncer", "vacina", "células"], "biologia"],
  ["Clima & Oceanos", ["clima", "climática", "aquecimento", "oceano", "corais"], "biologia"],
  ["Big Techs", ["apple", "microsoft", "meta", "amazon", "samsung", "ibm", "nvidia", "xbox"], "tecnologia"],
];

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function contemTermo(texto: string, termo: string): boolean {
  const re = new RegExp(
    `(^|[^a-zà-ú0-9])${escaparRegex(termo)}([^a-zà-ú0-9]|$)`,
    "i"
  );
  return re.test(texto);
}

export function extrairTendencias(
  noticias: NoticiaFeed[],
  limite = 6
): Tendencia[] {
  const tendencias: Tendencia[] = [];

  for (const [termo, buscas, categoria] of ENTIDADES) {
    let mencoes = 0;
    const portais = new Set<string>();
    for (const n of noticias) {
      const texto = (n.manchete + " " + n.resumo).toLowerCase();
      if (buscas.some((b) => contemTermo(texto, b))) {
        mencoes++;
        portais.add(n.fonteNome ?? "Redação");
      }
    }
    if (mencoes >= 2) {
      tendencias.push({
        termo,
        categoria,
        mencoes,
        portais: [...portais].slice(0, 4),
      });
    }
  }

  return tendencias.sort((a, b) => b.mencoes - a.mencoes).slice(0, limite);
}
