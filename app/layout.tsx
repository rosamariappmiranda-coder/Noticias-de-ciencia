import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import GrainOverlay from "@/components/GrainOverlay";
import BarraNav from "@/components/BarraNav";
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

// SISTEMA TIPOGRÁFICO — só DUAS famílias, pra tudo "ornar":
//
//   Space Grotesk → títulos, marca, rótulos e números (a fonte dos
//                   produtos premium atuais: geométrica e moderna)
//   Inter         → corpo de texto (a referência em legibilidade)
//
// As classes .font-display e .font-telemetry (globals.css) apontam
// AMBAS pra Space Grotesk — rótulo e título são a mesma voz, mudando
// só tamanho/peso/espaçamento. É isso que faz o site parecer UM.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXO — seu feed de conhecimento",
  description:
    "Ciência, espaço e tecnologia — um feed personalizado que aprende com você.",
  // Pede pro Google Tradutor NÃO traduzir o site. Tradutores automáticos
  // trocam os textos por novos nós de HTML, o que "confunde" o React e
  // causa o erro "Failed to execute 'insertBefore' on 'Node'". Como o
  // site já é em português, não há nada pra traduzir mesmo.
  other: { google: "notranslate" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" translate="no">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
      >
        {children}

        {/* Navbar de vidro fixa no topo em todas as páginas: a marca à
            esquerda e a área do usuário (Entrar / avatar + Sair) à
            direita. */}
        <BarraNav />

        {/* Grão de filme por cima de tudo (menos da contagem
            regressiva, que tem z-index ainda mais alto). */}
        <GrainOverlay />
      </body>
    </html>
  );
}
