import StarField from "@/components/StarField";
import CountdownIntro from "@/components/CountdownIntro";
import ReelsFeed from "@/components/ReelsFeed";

// Etapa "Feed Reels" (12/07/2026): o site pivotou de "blog com
// scrollytelling" pra "feed vertical estilo TikTok/Reels" — cada
// notícia ocupa a tela inteira e um gesto de rolagem encaixa
// exatamente na próxima. LaunchFrames, PortalIntro e NewsFeed saíram
// desta página (o ReelsFeed já contém tudo: o hero do foguete e um
// slide por notícia), mas os ARQUIVOS continuam no repositório —
// deleção só acontece com confirmação explícita da Rosa.
export default function Home() {
  return (
    <>
      {/* Fundo de estrelas fixo, atrás de tudo (z-0) */}
      <StarField />

      {/* Contagem regressiva discreta no canto superior esquerdo
          (T-10 até a ignição) — não bloqueia nada: a pessoa pode
          scrollar desde o primeiro instante. Some sozinha ao zerar. */}
      <CountdownIntro />

      {/* O feed inteiro: slide 0 é a ignição do foguete (HeroReel),
          seguido de um slide em tela cheia por notícia (NewsReel). É
          este componente que agora controla o scroll da página
          inteira (ver `overflow: hidden` no body, em globals.css). */}
      <ReelsFeed />
    </>
  );
}
