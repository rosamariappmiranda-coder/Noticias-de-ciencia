import StarField from "@/components/StarField";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import HeroHelix from "@/components/HeroHelix";

// Cópia "Hero Helix" (12/07/2026): protótipo do efeito estilo
// helixearth.com numa porta separada (:3005), sem tocar no projeto
// original (:3002). A página é bem enxuta de propósito — só o
// necessário pra PROVAR a dissolução do foguete no céu estrelado:
//
//   StarField (fundo fixo, z-0)
//     → HeroHelix (o foguete arrastado pelo scroll + dissolução)
//       → uma seção curta de conteúdo de exemplo (pra ver a emenda).
//
// SmoothScrollProvider religa o Lenis (scroll suave) que o projeto
// original desativou ao virar feed Reels — aqui ele é essencial.
export default function Home() {
  return (
    <SmoothScrollProvider>
      {/* Céu de estrelas fixo, atrás de tudo. É ele que "aparece"
          quando o canvas do foguete se dissolve. */}
      <StarField />

      {/* O hero: o foguete tocando pelo scroll e, no fim, sumindo pra
          revelar o título sobre o céu. */}
      <HeroHelix />

      {/* Seção de conteúdo logo abaixo do hero — só um exemplo, com a
          copy do portal, pra confirmar que a transição emenda numa
          leitura normal. Fundo translúcido pra deixar o céu vazar por
          trás e manter a continuidade visual. */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 py-24 md:py-32">
        <div className="mb-5 h-px w-14 bg-[var(--accent)]" />
        <h2 className="font-display text-2xl font-bold tracking-[0.06em] text-[var(--text)] uppercase md:text-4xl">
          A ciência não para — e a gente também não
        </h2>
        <p className="font-body mt-6 text-base leading-relaxed text-[var(--text-dim)] md:text-lg">
          Espaço, tecnologia e as descobertas que estão redesenhando o
          mundo, contadas sem enrolação. Cada matéria é uma pequena
          missão: começa na ignição e termina no que isso muda pra
          você.
        </p>
        <p className="font-body mt-4 text-base leading-relaxed text-[var(--text-dim)] md:text-lg">
          Role de volta pro topo pra ver o foguete ganhar o céu outra
          vez — do primeiro fotograma à dissolução nas estrelas.
        </p>
      </section>
    </SmoothScrollProvider>
  );
}
