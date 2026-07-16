/**
 * Cliente Supabase para o NAVEGADOR
 * ---------------------------------------------------------------
 * Usado por componentes "use client" (que rodam no navegador da
 * pessoa). Ele guarda a sessão do usuário em cookies automaticamente.
 *
 * As duas variáveis vêm do .env.local (são públicas de propósito —
 * quem protege os dados é a segurança RLS do banco, não o segredo
 * delas).
 * ---------------------------------------------------------------
 */

import { createBrowserClient } from "@supabase/ssr";

export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
