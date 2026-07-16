"use client";

/**
 * PainelComentarios
 * ---------------------------------------------------------------
 * A parte "rede social" de cada notícia: mostra os comentários de
 * TODO MUNDO (leitura é pública), deixa RESPONDER (um nível, como no
 * Instagram) e CURTIR comentários. Postar/curtir exige login — quem
 * não está logado é convidado a entrar (via aoExigirLogin).
 *
 * Pra ficar simples e sempre correto, depois de cada ação a gente
 * recarrega a lista do banco (carregar()). Como o painel só abre quando
 * a pessoa clica em "Comentar", esse custo é baixo.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Comentario = {
  id: string;
  texto: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  autorNome: string;
  curtidas: number;
  euCurti: boolean;
};

// "há X" — tempo relativo simples em pt-BR (agora / min / h / d).
function tempoRelativo(iso: string): string {
  const seg = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export default function PainelComentarios({
  noticiaSlug,
  usuarioId,
  aoExigirLogin,
}: {
  noticiaSlug: string;
  usuarioId: string | null;
  aoExigirLogin: () => void;
}) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [respondendoA, setRespondendoA] = useState<string | null>(null);

  const supabaseRef = useRef<ReturnType<typeof criarClienteNavegador> | null>(
    null
  );
  if (!supabaseRef.current) supabaseRef.current = criarClienteNavegador();

  // Busca os comentários da notícia + o nome de quem escreveu + a
  // contagem de curtidas de cada um (e se EU curti).
  async function carregar() {
    const supabase = supabaseRef.current!;
    const { data: coms, error } = await supabase
      .from("comentarios")
      // profiles!comentarios_user_id_fkey diz explicitamente qual
      // ligação usar (existe mais de um caminho entre comentários e
      // perfis, então precisamos apontar o certo: o autor do comentário).
      .select(
        "id, texto, created_at, parent_id, user_id, profiles!comentarios_user_id_fkey(nome)"
      )
      .eq("noticia_slug", noticiaSlug)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar comentários:", error.message);
      setCarregando(false);
      return;
    }

    const ids = (coms ?? []).map((c) => c.id as string);
    const contagem = new Map<string, number>();
    const meus = new Set<string>();
    if (ids.length) {
      const { data: curts } = await supabase
        .from("comentario_curtidas")
        .select("comentario_id, user_id")
        .in("comentario_id", ids);
      for (const cu of curts ?? []) {
        contagem.set(
          cu.comentario_id,
          (contagem.get(cu.comentario_id) ?? 0) + 1
        );
        if (usuarioId && cu.user_id === usuarioId) meus.add(cu.comentario_id);
      }
    }

    const lista: Comentario[] = (coms ?? []).map((c) => {
      // `profiles` pode vir como objeto (esperado) ou, em alguns casos,
      // como lista — tratamos os dois pra pegar o nome com segurança.
      const perfil = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return {
        id: c.id,
        texto: c.texto,
        created_at: c.created_at,
        parent_id: c.parent_id,
        user_id: c.user_id,
        autorNome: perfil?.nome ?? "Alguém",
        curtidas: contagem.get(c.id) ?? 0,
        euCurti: meus.has(c.id),
      };
    });
    setComentarios(lista);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar(texto: string, parentId: string | null) {
    if (!usuarioId) {
      aoExigirLogin();
      return;
    }
    const t = texto.trim();
    if (!t) return;
    const supabase = supabaseRef.current!;
    const { error } = await supabase.from("comentarios").insert({
      noticia_slug: noticiaSlug,
      user_id: usuarioId,
      texto: t,
      parent_id: parentId,
    });
    if (error) {
      console.error("Erro ao comentar:", error.message);
      return;
    }
    setRespondendoA(null);
    await carregar();
  }

  async function alternarCurtida(c: Comentario) {
    if (!usuarioId) {
      aoExigirLogin();
      return;
    }
    const supabase = supabaseRef.current!;
    const { error } = c.euCurti
      ? await supabase
          .from("comentario_curtidas")
          .delete()
          .eq("comentario_id", c.id)
          .eq("user_id", usuarioId)
      : await supabase
          .from("comentario_curtidas")
          .insert({ comentario_id: c.id, user_id: usuarioId });
    if (error) {
      console.error("Erro ao curtir comentário:", error.message);
      return;
    }
    await carregar();
  }

  const principais = comentarios.filter((c) => c.parent_id === null);
  const respostasDe = (id: string) =>
    comentarios.filter((c) => c.parent_id === id);

  return (
    <div className="mt-2 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-sm">
      {/* Campo de novo comentário (ou convite pra entrar). */}
      {usuarioId ? (
        <FormularioComentario
          placeholder="Escreva um comentário…"
          aoEnviar={(texto) => enviar(texto, null)}
        />
      ) : (
        <button
          type="button"
          onClick={aoExigirLogin}
          className="w-full rounded-full border border-white/15 px-4 py-2 text-left text-sm text-[var(--text-dim)] transition hover:border-white/40 hover:text-[var(--text)]"
        >
          Entre pra comentar…
        </button>
      )}

      {/* Lista de comentários. */}
      <div className="mt-4 flex flex-col gap-4">
        {carregando && (
          <p className="text-sm text-[var(--text-dim)]">
            Carregando comentários…
          </p>
        )}
        {!carregando && principais.length === 0 && (
          <p className="text-sm text-[var(--text-dim)]">
            Nenhum comentário ainda. Seja a primeira pessoa a comentar! ✨
          </p>
        )}
        {principais.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <ComentarioItem
              c={c}
              aoCurtir={() => alternarCurtida(c)}
              aoResponder={() =>
                setRespondendoA(respondendoA === c.id ? null : c.id)
              }
            />

            {/* Respostas (um nível), recuadas. */}
            {respostasDe(c.id).length > 0 && (
              <div className="ml-6 flex flex-col gap-2 border-l border-white/10 pl-4">
                {respostasDe(c.id).map((r) => (
                  <ComentarioItem
                    key={r.id}
                    c={r}
                    aoCurtir={() => alternarCurtida(r)}
                  />
                ))}
              </div>
            )}

            {/* Campo de resposta (aparece ao clicar em "Responder"). */}
            {respondendoA === c.id && (
              <div className="ml-6 pl-4">
                <FormularioComentario
                  placeholder={`Responder ${c.autorNome}…`}
                  aoEnviar={(texto) => enviar(texto, c.id)}
                  compacto
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------
// Um comentário (ou resposta): autor, tempo, texto, curtir e responder.
// --------------------------------------------------------------
function ComentarioItem({
  c,
  aoCurtir,
  aoResponder,
}: {
  c: Comentario;
  aoCurtir: () => void;
  aoResponder?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-semibold text-[var(--text)]">
          {c.autorNome}
        </span>
        <span className="font-telemetry text-[10px] tracking-wider text-[var(--text-dim)] uppercase">
          {tempoRelativo(c.created_at)}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-[var(--text)]">
        {c.texto}
      </p>
      <div className="mt-1 flex items-center gap-4">
        <button
          type="button"
          onClick={aoCurtir}
          aria-label={c.euCurti ? "Descurtir comentário" : "Curtir comentário"}
          className={`flex items-center gap-1 text-xs transition active:scale-90 ${
            c.euCurti
              ? "text-[var(--accent)]"
              : "text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          <span>{c.euCurti ? "❤️" : "🤍"}</span>
          {c.curtidas > 0 && <span className="tabular-nums">{c.curtidas}</span>}
        </button>
        {aoResponder && (
          <button
            type="button"
            onClick={aoResponder}
            className="text-xs text-[var(--text-dim)] transition hover:text-[var(--text)]"
          >
            Responder
          </button>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------
// Campo de escrever comentário/resposta. Guarda o texto localmente e
// chama aoEnviar quando a pessoa envia.
// --------------------------------------------------------------
function FormularioComentario({
  placeholder,
  aoEnviar,
  compacto,
}: {
  placeholder: string;
  aoEnviar: (texto: string) => void;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState("");

  function submeter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!texto.trim()) return;
    aoEnviar(texto);
    setTexto("");
  }

  return (
    <form onSubmit={submeter} className="flex gap-2">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        className="font-body flex-1 rounded-full bg-white/5 px-4 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:bg-white/10"
      />
      <button
        type="submit"
        className={`rounded-full bg-[var(--accent)] font-medium text-black transition active:scale-90 ${
          compacto ? "px-4 py-2 text-xs" : "px-5 py-2 text-sm"
        }`}
      >
        Enviar
      </button>
    </form>
  );
}
