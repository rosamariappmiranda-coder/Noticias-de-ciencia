import StarField from "@/components/StarField";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import HeroHelix from "@/components/HeroHelix";
import FeedNoticias from "@/components/FeedNoticias";

// Cópia "Hero Helix" (12/07/2026): efeito estilo helixearth.com numa
// porta separada (:3005), sem tocar no projeto original (:3002).
//
//   StarField (fundo fixo, z-0)
//     → HeroHelix (o foguete arrastado pelo scroll + dissolução)
//       → FeedNoticias (as 12 notícias como "reels" imersivos,
//          com imagem animada no scroll — peça 1 da plataforma).
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

      {/* O feed de notícias logo abaixo do hero. */}
      <FeedNoticias />
    </SmoothScrollProvider>
  );
}
