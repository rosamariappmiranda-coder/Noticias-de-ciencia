/**
 * EmAlta24h — a seção de DESCOBERTA
 * ---------------------------------------------------------------
 * Mostra os assuntos de ciência e tecnologia em alta AGORA na web
 * brasileira, coletados do Google Notícias e curados para deixar
 * fora tudo que a diretriz do produto exclui (guerra, política
 * partidária, celebridade, crime, acidente). Ver lib/em-alta.ts.
 *
 * Cada item é um link para a matéria na FONTE — a descoberta leva a
 * pessoa para fora e para dentro ao mesmo tempo: ela lê algo novo, e
 * associa o NEXO ao "lugar onde eu descobri isso".
 *
 * É um Server Component (async): busca os dados no servidor, já
 * renderizados, sem custo de JavaScript no navegador. O componente
 * inteiro some em silêncio se o Google Notícias estiver fora do ar
 * (buscarEmAlta nunca lança erro — devolve lista vazia).
 * ---------------------------------------------------------------
 */

import { buscarEmAlta } from "@/lib/em-alta";

// Quantos assuntos exibir. 10 é o ponto onde a seção ainda respira —
// acima disso vira parede de texto.
const QUANTOS = 10;

export default async function EmAlta24h() {
  const assuntos = await buscarEmAlta(QUANTOS);

  // Sem dados, a seção não aparece. Melhor ausência do que um bloco
  // vazio quebrando o ritmo da página.
  if (assuntos.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-4 py-24 md:px-6 md:py-32">
      {/* Cabeçalho */}
      <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <p className="font-telemetry flex items-center gap-2 text-[11px] text-[var(--accent)] uppercase">
            <span className="pulso-sinal inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Em alta · 24h
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.02em] text-[var(--text)] md:text-4xl">
            O que a web descobriu hoje
          </h2>
        </div>
      </div>

      {/* Lista de assuntos. Cada linha é um link para a fonte. */}
      <ol className="flex flex-col">
        {assuntos.map((assunto, i) => (
          <li key={assunto.url}>
            <a
              href={assunto.url}
              target="_blank"
              // noopener/noreferrer: segurança padrão de link em nova
              // aba — impede a página de destino de manipular a nossa.
              rel="noopener noreferrer"
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-b border-white/5 py-5 transition-colors hover:bg-white/[0.02] md:gap-x-6"
            >
              {/* Número de ordem — grande e vazado, estética de dado */}
              <span
                aria-hidden="true"
                className="font-display w-10 text-3xl leading-none font-bold md:w-14 md:text-5xl"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,0.18)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Manchete + fonte */}
              <div className="min-w-0">
                <p className="text-sm leading-snug font-medium text-[var(--text)] transition-colors group-hover:text-[var(--accent)] md:text-base">
                  {assunto.titulo}
                </p>
                <p className="font-telemetry mt-1.5 text-[10px] tracking-[0.12em] text-[var(--text-dim)] uppercase">
                  {assunto.categoria} · {assunto.fonte}
                </p>
              </div>

              {/* Seta de saída, aparece no hover */}
              <span
                aria-hidden="true"
                className="text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100"
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
