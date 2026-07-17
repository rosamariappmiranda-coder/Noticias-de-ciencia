/**
 * Algoritmo de recomendação do feed
 * ---------------------------------------------------------------
 * A ideia central é a MESMA dos algoritmos de Instagram/TikTok, numa
 * versão enxuta e transparente:
 *
 *   1) Cada interação sua (curtir, comentar, salvar) é um SINAL de
 *      interesse por uma CATEGORIA (espaço, IA, física...).
 *   2) Sinais mais "fortes" (salvar/comentar dão mais trabalho que
 *      curtir) e mais RECENTES pesam mais.
 *   3) Somamos isso numa "afinidade" por categoria.
 *   4) O feed é ordenado por afinidade — mostrando mais do que você
 *      curte — com um tiquinho de aleatoriedade pra "explorar" coisas
 *      novas (senão o feed engessa e fica repetitivo).
 *
 * Tudo isso roda no SERVIDOR (em app/page.tsx), a cada carregamento.
 * Quando o robô de notícias trouxer centenas de matérias por dia, este
 * mesmo algoritmo escala sem mudar nada.
 * ---------------------------------------------------------------
 */

import type { Categoria } from "@/content/noticias";
import type { NoticiaFeed } from "@/lib/tipos-feed";

// Peso de cada tipo de interação. Salvar e comentar valem mais que
// curtir — são esforços maiores, logo sinais de interesse mais fortes.
// A VISUALIZAÇÃO (ficar um tempo olhando a notícia) é o sinal mais
// fraco individualmente, mas é o que o TikTok mais usa: em volume, o
// "tempo de atenção" revela o gosto melhor que qualquer clique.
const PESO: Record<
  "curtida" | "comentario" | "salvo" | "visualizacao",
  number
> = {
  visualizacao: 0.5,
  curtida: 1,
  comentario: 2,
  salvo: 3,
};

export type SinalInteracao = {
  categoria: Categoria;
  tipo: "curtida" | "comentario" | "salvo" | "visualizacao";
  quando: string; // data/hora ISO em que a interação aconteceu
};

// Quanto uma interação "vale" hoje: decai com o tempo, pra o feed
// acompanhar seu interesse ATUAL (o que você curtiu ontem importa mais
// do que o que curtiu há meses).
function fatorRecencia(quandoISO: string): number {
  const dias = (Date.now() - new Date(quandoISO).getTime()) / 86_400_000;
  if (dias <= 3) return 1; // últimos 3 dias: peso cheio
  if (dias <= 14) return 0.6; // até 2 semanas
  if (dias <= 45) return 0.3; // até ~1,5 mês
  return 0.1; // mais antigo: pouco peso
}

// Soma os sinais numa nota de afinidade por categoria.
export function calcularAfinidades(
  sinais: SinalInteracao[]
): Map<Categoria, number> {
  const afinidade = new Map<Categoria, number>();
  for (const s of sinais) {
    const ganho = PESO[s.tipo] * fatorRecencia(s.quando);
    afinidade.set(s.categoria, (afinidade.get(s.categoria) ?? 0) + ganho);
  }
  return afinidade;
}

// Ordena as notícias para este usuário. Nota de cada notícia =
// afinidade da categoria (domina) + frescor (novidade) + exploração
// (aleatoriedade pequena). Sem sinais (visitante novo), a afinidade é 0
// e o feed cai no frescor — ou seja, mostra as mais recentes primeiro.
export function ordenarFeed(
  noticias: NoticiaFeed[],
  sinais: SinalInteracao[]
): NoticiaFeed[] {
  const afinidade = calcularAfinidades(sinais);
  const agora = Date.now();

  function pontuar(n: NoticiaFeed): number {
    const afin = afinidade.get(n.categoria) ?? 0;

    // Frescor: 1 (bem nova) → 0 (com ~4 meses). Dá um empurrão às novas.
    const diasDeVida =
      (agora - new Date(n.dataISO + "T00:00:00").getTime()) / 86_400_000;
    const frescor = Math.max(0, 1 - diasDeVida / 120);

    // Exploração: até 15% de aleatoriedade, pra variar o feed e não
    // prender a pessoa só no que ela já conhece.
    const exploracao = Math.random() * 0.15;

    // Afinidade pesa 3× — é o coração da personalização.
    return afin * 3 + frescor + exploracao;
  }

  // Cria uma cópia antes de ordenar (não bagunça o array original).
  return [...noticias].sort((a, b) => pontuar(b) - pontuar(a));
}
