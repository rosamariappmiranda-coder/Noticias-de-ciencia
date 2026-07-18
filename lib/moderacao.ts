/**
 * Moderação de texto — o "porteiro" dos comentários
 * ---------------------------------------------------------------
 * Um filtro simples e honesto: barra comentário vazio, comentário
 * gigante (spam), e palavrões/ataques óbvios. Não é (e nem tem como
 * ser) perfeito — moderação de verdade é um trabalho sem fim — mas
 * evita que o PRIMEIRO comentário ruim vire um print constrangedor
 * logo no lançamento.
 *
 * IMPORTANTE: este arquivo roda no NAVEGADOR (dá aviso instantâneo pra
 * pessoa). A trava "de verdade", que ninguém burla, é uma cópia dessa
 * lógica dentro do banco de dados (um gatilho no Postgres). Se um dia
 * você mexer na lista aqui, lembre de espelhar lá também.
 * ---------------------------------------------------------------
 */

// Tamanho máximo de um comentário. Acima disso quase sempre é spam
// (parede de texto, link repetido, etc.).
export const TAMANHO_MAXIMO_COMENTARIO = 600;

// Lista de termos bloqueados. Mantemos curta e de baixo risco: palavras
// que praticamente nunca aparecem num comentário legítimo sobre ciência.
// (Guardamos SEM acento — a função de checagem também tira o acento do
// texto do usuário antes de comparar, então "idiota"/"ídiota" caem juntos.)
const TERMOS_BLOQUEADOS = [
  // xingamentos / ataques pessoais mais comuns em pt-BR
  "idiota",
  "imbecil",
  "burro",
  "otario",
  "otaria",
  "babaca",
  "arrombado",
  "corno",
  "vagabundo",
  "vagabunda",
  "puta",
  "puto",
  "viado",
  "bicha",
  "retardado",
  "escroto",
  "merda",
  "bosta",
  "caralho",
  "porra",
  "foda-se",
  "vsf",
  "vtnc",
  "fdp",
  "cuzao",
  "cuzão",
  "buceta",
  "piranha",
  // spam / golpe
  "ganhe dinheiro",
  "clique aqui",
  "compre agora",
  "renda extra",
  "trabalhe em casa",
  "www.",
  "http://",
  "https://",
];

/**
 * Tira acentos e deixa em minúsculo — assim "Otário" e "otario" viram
 * a mesma coisa na hora de comparar. `normalize("NFD")` separa a letra
 * do acento; o regex remove os acentos soltos.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Resultado da checagem: se pode passar (`ok`) e, se não, uma mensagem
 * amigável pra mostrar pra pessoa explicando o porquê.
 */
export type ResultadoModeracao = { ok: true } | { ok: false; motivo: string };

/**
 * A checagem em si. Retorna `{ ok: true }` quando o texto pode ser
 * publicado, ou `{ ok: false, motivo }` quando deve ser barrado.
 */
export function moderarComentario(textoBruto: string): ResultadoModeracao {
  const texto = textoBruto.trim();

  if (texto.length === 0) {
    return { ok: false, motivo: "Escreva algo antes de enviar." };
  }

  if (texto.length > TAMANHO_MAXIMO_COMENTARIO) {
    return {
      ok: false,
      motivo: `Comentário muito longo (máx. ${TAMANHO_MAXIMO_COMENTARIO} caracteres).`,
    };
  }

  // Compara a versão sem acento do texto contra cada termo bloqueado.
  const normalizado = normalizar(texto);
  for (const termo of TERMOS_BLOQUEADOS) {
    if (normalizado.includes(normalizar(termo))) {
      return {
        ok: false,
        motivo:
          "Seu comentário parece ter linguagem ofensiva ou spam. Vamos manter o papo respeitoso :)",
      };
    }
  }

  return { ok: true };
}
