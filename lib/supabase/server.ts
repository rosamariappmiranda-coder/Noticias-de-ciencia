/**
 * Cliente Supabase para o SERVIDOR
 * ---------------------------------------------------------------
 * Usado em componentes de servidor e "server actions" (código que
 * roda no servidor do Next, não no navegador). Aqui a sessão do
 * usuário vive nos cookies da requisição — por isso passamos as
 * funções getAll/setAll ligadas ao cookieStore do next/headers.
 *
 * É "async" porque `cookies()` virou assíncrono no Next 15.
 * ---------------------------------------------------------------
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lê todos os cookies da requisição atual.
        getAll() {
          return cookieStore.getAll();
        },
        // Grava/atualiza cookies (ex.: quando a sessão é renovada).
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se `setAll` for chamado de dentro de um Server Component
            // (onde não dá pra escrever cookies), ignoramos — quem
            // renova a sessão de verdade é o middleware.
          }
        },
      },
    }
  );
}
