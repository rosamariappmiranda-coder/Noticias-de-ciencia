/**
 * Tipo unificado das notícias do FEED
 * ---------------------------------------------------------------
 * O feed mistura duas origens de notícia:
 *   1) as escritas à mão em content/noticias.ts (completas, com corpo)
 *   2) as agregadas pelo robô, vindas da tabela `noticias` do banco
 *      (manchete + resumo + imagem + link pra fonte)
 *
 * Este tipo é o "mínimo comum" que os componentes do feed precisam —
 * qualquer origem que preencher estes campos aparece no feed.
 * ---------------------------------------------------------------
 */

import type { Categoria } from "@/content/noticias";

export type NoticiaFeed = {
  slug: string;
  categoria: Categoria;
  manchete: string;
  resumo: string;
  imagem: string | null; // pode faltar nas agregadas — o card tem visual reserva
  dataISO: string; // AAAA-MM-DD
  fonteNome: string | null; // ex.: "Olhar Digital" (null = conteúdo nosso)
  urlFonte: string | null; // link pra matéria original (crédito de agregador)
};
