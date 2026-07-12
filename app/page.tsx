import StarField from "@/components/StarField";
import CountdownIntro from "@/components/CountdownIntro";
import LaunchFrames from "@/components/LaunchFrames";

export default function Home() {
  return (
    <>
      {/* Fundo de estrelas fixo, atrás de tudo (z-0) */}
      <StarField />

      {/* Overlay de contagem regressiva — aparece por cima de tudo
          e some sozinho depois de ~3.6s (fade-out incluído). */}
      <CountdownIntro />

      <main className="relative">
        <LaunchFrames />

        {/* Seção de exemplo, só para confirmar que a rolagem
            continua normalmente depois que o foguete sai de tela.
            Aqui entram as próximas seções (ex.: o feed de notícias
            de verdade) — por enquanto, um card fake só pra dar
            gosto do que vem, já com os tokens de design novos. */}
        <section className="relative flex min-h-screen items-center justify-center bg-[var(--surface)] px-6 py-24">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--bg)]/60 p-6 shadow-[0_0_40px_rgba(91,140,255,0.08)]">
            <span className="font-telemetry text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
              destaque · astrofísica
            </span>
            <h2 className="font-display mt-3 text-2xl font-semibold leading-snug text-[var(--text)]">
              Telescópio James Webb encontra água em exoplaneta rochoso
            </h2>
            <p className="mt-3 text-sm text-[var(--text-dim)]">
              O feed de notícias completo chega na próxima fase — aqui é só
              um gostinho do que vem por aí.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
