import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Libera o domínio da biblioteca de imagens da NASA (domínio
    // público) como fonte permitida pro next/image otimizar — sem
    // isso, o Next bloqueia por segurança qualquer imagem que não
    // venha do próprio site ou de um domínio explicitamente liberado.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images-assets.nasa.gov",
      },
    ],
  },
};

export default nextConfig;
