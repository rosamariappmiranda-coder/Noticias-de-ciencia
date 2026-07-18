/**
 * Leitura segura das variáveis de ambiente do Supabase
 * ---------------------------------------------------------------
 * Ao colar valores no painel da Vercel é muito fácil levar junto um
 * espaço, uma quebra de linha ou um par de aspas. O Supabase então
 * recusa o endereço ("Invalid supabaseUrl: Must be a valid HTTP or
 * HTTPS URL") e a tela inteira quebra — um bug bem chato de descobrir.
 *
 * Este arquivo centraliza a limpeza desses valores, pra que navegador,
 * servidor e middleware leiam todos da mesma forma.
 * ---------------------------------------------------------------
 */

/** Tira espaços, quebras de linha e aspas que tenham vindo coladas. */
export function limparVariavel(valor: string | undefined): string {
  return (valor ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

/** O endereço do projeto Supabase, já limpo. */
export function urlSupabase(): string {
  return limparVariavel(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** A chave pública (anon) do Supabase, já limpa. */
export function chaveSupabase(): string {
  return limparVariavel(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
