"use server";

/**
 * Ações de autenticação ("server actions")
 * ---------------------------------------------------------------
 * "use server" no topo = todas as funções deste arquivo rodam NO
 * SERVIDOR, nunca no navegador. É onde é seguro conversar com o
 * Supabase pra criar conta, entrar e sair.
 *
 * Cada função recebe os dados do formulário (FormData) e, no fim,
 * redireciona a pessoa pra algum lugar (home, ou de volta ao login
 * com uma mensagem de erro/sucesso).
 * ---------------------------------------------------------------
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { criarClienteServidor } from "@/lib/supabase/server";

// ENTRAR com email + senha.
export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    redirect(
      "/login?erro=" + encodeURIComponent("Email ou senha incorretos.")
    );
  }

  // Revalida o layout pra a "BarraUsuario" já aparecer logada, e leva
  // a pessoa de volta ao feed.
  revalidatePath("/", "layout");
  redirect("/");
}

// CRIAR CONTA com nome + email + senha.
export async function criarConta(formData: FormData) {
  const nome = String(formData.get("nome") ?? "");
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    // O `nome` vai junto como "metadado" do usuário — o gatilho que
    // criamos no banco lê esse valor pra preencher a tabela profiles.
    options: { data: { nome } },
  });

  if (error) {
    redirect(
      "/login?modo=cadastro&erro=" + encodeURIComponent(error.message)
    );
  }

  // Se o projeto NÃO exige confirmação de email, o cadastro já vem
  // logado (tem sessão) — mandamos direto pro feed. Se EXIGE (padrão),
  // não há sessão ainda: avisamos pra confirmar pelo link do email.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  redirect(
    "/login?mensagem=" +
      encodeURIComponent(
        "Conta criada! Confirme pelo link enviado ao seu email para entrar."
      )
  );
}

// ENTRAR COM GOOGLE. Só funciona depois que o Google for configurado
// no painel do Supabase (ver o passo a passo que a Rosa vai receber).
// Enquanto não estiver configurado, cai na mensagem de erro amigável.
export async function entrarComGoogle() {
  const supabase = await criarClienteServidor();
  const cabecalhos = await headers();
  const origem = cabecalhos.get("origin") ?? "http://localhost:3005";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origem}/auth/callback` },
  });

  if (error || !data?.url) {
    redirect(
      "/login?erro=" +
        encodeURIComponent(
          "Login com Google ainda não está configurado. (A gente liga isso depois.)"
        )
    );
  }

  // Leva a pessoa pra tela de escolha de conta do Google.
  redirect(data.url);
}

// SAIR (encerra a sessão).
export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
