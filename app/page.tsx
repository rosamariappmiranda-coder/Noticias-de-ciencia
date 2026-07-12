import StarField from "@/components/StarField";
import CountdownIntro from "@/components/CountdownIntro";
import LaunchFrames from "@/components/LaunchFrames";
import PortalIntro from "@/components/PortalIntro";
import NewsFeed from "@/components/NewsFeed";

export default function Home() {
  return (
    <>
      {/* Fundo de estrelas fixo, atrás de tudo (z-0) */}
      <StarField />

      {/* Contagem regressiva discreta no canto superior esquerdo
          (T-10 até a ignição) — não bloqueia nada: a pessoa pode
          scrollar desde o primeiro instante. Some sozinha ao zerar. */}
      <CountdownIntro />

      <main className="relative">
        <LaunchFrames />

        {/* Ancoragem: poucas frases apresentando o portal, logo
            depois do impacto visual do hero. */}
        <PortalIntro />

        {/* Feed scrollytelling: os cards de notícia (por enquanto,
            12 mocks realistas em content/noticias.ts) entram
            deslizando conforme a rolagem, como um feed de rede
            social com identidade própria. */}
        <NewsFeed />
      </main>
    </>
  );
}
