/**
 * RadarTendencias
 * ---------------------------------------------------------------
 * O painel "o que o mundo está discutindo agora": ranking dos assuntos
 * mais cobertos pelas fontes que agregamos, com a barra de volume e os
 * portais que estão falando de cada um.
 *
 * Estética de console de dados: tipografia mono, linhas finas, números
 * gigantes vazados — nada de cartão pesado, nada de emoji.
 * É um componente de servidor (só recebe dados prontos e desenha).
 * ---------------------------------------------------------------
 */

import type { Tendencia } from "@/lib/tendencias";
import type { Categoria } from "@/content/noticias";

const COR: Record<Categoria, string> = {
  espaço: "#5b8cff",
  tecnologia: "#ffb56b",
  física: "#6be3ff",
  biologia: "#7dffa9",
  ia: "#c79bff",
};

export default function RadarTendencias({
  tendencias,
}: {
  tendencias: Tendencia[];
}) {
  if (tendencias.length === 0) return null;

  const maximo = Math.max(...tendencias.map((t) => t.mencoes));

  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-6 py-24 md:py-32">
      {/* Cabeçalho do painel */}
      <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <p className="font-telemetry text-[10px] tracking-[0.4em] text-[var(--accent)] uppercase">
            radar
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-[0.02em] text-[var(--text)] uppercase md:text-4xl">
            O que o mundo está discutindo
          </h2>
        </div>
        <p className="font-telemetry hidden text-right text-[10px] leading-relaxed tracking-[0.2em] text-[var(--text-dim)] uppercase sm:block">
          cobertura das últimas 24h
          <br />
          {tendencias.reduce((s, t) => s + t.mencoes, 0)} matérias analisadas
        </p>
      </div>

      {/* Ranking */}
      <ol className="flex flex-col">
        {tendencias.map((t, i) => (
          <li
            key={t.termo}
            className="group grid grid-cols-[auto_1fr] items-center gap-x-5 border-b border-white/5 py-5 transition-colors hover:bg-white/[0.02] md:gap-x-8"
          >
            {/* Posição — número gigante vazado */}
            <span
              aria-hidden="true"
              className="font-display w-14 text-4xl leading-none font-bold md:w-20 md:text-6xl"
              style={{ color: "transparent", WebkitTextStroke: `1px ${COR[t.categoria]}66` }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-lg font-semibold text-[var(--text)] md:text-2xl">
                  {t.termo}
                </h3>
                <span
                  className="font-telemetry text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: COR[t.categoria] }}
                >
                  {t.categoria}
                </span>
              </div>

              {/* Barra de volume relativa ao 1º lugar */}
              <div className="mt-2 h-px w-full bg-white/5">
                <div
                  className="h-px transition-transform duration-700"
                  style={{
                    width: `${(t.mencoes / maximo) * 100}%`,
                    backgroundColor: COR[t.categoria],
                    boxShadow: `0 0 8px ${COR[t.categoria]}`,
                  }}
                />
              </div>

              {/* Quem está cobrindo */}
              <p className="font-telemetry mt-2 truncate text-[11px] tracking-[0.1em] text-[var(--text-dim)]">
                {t.mencoes} matérias · {t.portais.join(" · ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
