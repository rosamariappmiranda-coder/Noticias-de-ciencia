import type { Metadata } from "next";
import { Chakra_Petch, Sora, IBM_Plex_Mono } from "next/font/google";
import GrainOverlay from "@/components/GrainOverlay";
import BarraUsuario from "@/components/BarraUsuario";
import "./globals.css";

// Etapa "Feed Reels" (12/07/2026): o SmoothScrollProvider (Lenis)
// saiu do layout — Lenis intercepta e "amortece" a rolagem da roda
// do mouse pra animar o scroll do body sozinho, o que BRIGA com o
// scroll-snap nativo do ReelsFeed (o feed some de esperar o encaixe
// exato em cada slide). O arquivo continua no repositório, só não é
// mais usado aqui.

/**
 * Fontes do projeto (via next/font/google)
 * ---------------------------------------------------------------
 * next/font baixa as fontes durante o build e serve elas pelo
 * próprio domínio do site (mais rápido e mais privado do que
 * carregar direto do Google Fonts). Cada fonte vira uma "variável
 * CSS" (ex.: --font-display) que os componentes usam para escolher
 * qual fonte aplicar em cada texto.
 */

// Fonte de destaque: títulos grandes e números de telemetria.
// Traços retos e técnicos — clima de painel de nave espacial.
const chakraPetch = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Fonte de corpo: usada por padrão em parágrafos e textos comuns.
const sora = Sora({
  variable: "--font-body",
  subsets: ["latin"],
});

// Fonte "telemetria": dados técnicos estilo HUD (painel de dados
// sobreposto), monoespaçada — todo caractere tem a mesma largura.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Notícias das Estrelas",
  description:
    "Notícias de ciência, espaço e tecnologia em uma viagem imersiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${chakraPetch.variable} ${sora.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {children}

        {/* Cantinho de login/usuário, fixo no topo direito em todas as
            páginas (mostra "Entrar" ou "Olá, <nome>" + Sair). */}
        <BarraUsuario />

        {/* Grão de filme por cima de tudo (menos da contagem
            regressiva, que tem z-index ainda mais alto). */}
        <GrainOverlay />
      </body>
    </html>
  );
}
