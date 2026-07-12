import HeroScene from "@/components/HeroScene";

export default function Home() {
  return (
    <main>
      <HeroScene />

      {/* Seção de exemplo, só para confirmar que a rolagem
          continua normalmente depois que a cena "solta". */}
      <section className="flex min-h-screen items-center justify-center bg-[#0a0f1e] text-white">
        <p className="max-w-md text-center text-white/70">
          Depois que a cena 3D solta, o resto da página rola normal.
          Aqui entram as próximas seções (ex.: o feed de notícias).
        </p>
      </section>
    </main>
  );
}
