/**
 * Frase-gancho do site — escolhida pela Rosa em 11/07/2026
 * (superou as 10 opções do copywriter!).
 *
 * Vive num arquivo próprio (e minúsculo) de propósito: tanto a intro
 * atual (LaunchFrames) quanto a cena 3D antiga (RocketScene) usam a
 * frase, e importá-la de um componente pesado arrastaria TODO o
 * código dele junto pro carregamento da página (o RocketScene puxa a
 * biblioteca 3D inteira, centenas de KB). Constante compartilhada =
 * arquivo pequeno e neutro.
 */
export const FRASE_GANCHO = "Seu feed de conhecimento";
