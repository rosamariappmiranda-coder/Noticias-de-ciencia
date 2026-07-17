import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // O feed agrega notícias de VÁRIOS portais, cada um com seu próprio
    // domínio de imagens (Olhar Digital, Canaltech, G1, NASA...). O "**"
    // libera qualquer domínio HTTPS pro next/image otimizar — aceitável
    // aqui porque só exibimos imagens vindas do nosso próprio banco de
    // notícias (inseridas pelo robô), não URLs digitadas por usuários.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
