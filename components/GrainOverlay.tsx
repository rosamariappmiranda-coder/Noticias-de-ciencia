/**
 * GrainOverlay
 * ---------------------------------------------------------------
 * Uma camada finíssima de "grão de filme" (o ruído granulado de
 * filme fotográfico antigo) por cima de TODO o site. Isso evita que
 * o fundo escuro pareça "liso e digital demais" — é o mesmo truque
 * visual usado em sites de referência tipo helixearth.com.
 *
 * Não precisa de "use client": é só uma <div> com uma imagem SVG
 * estática de fundo. Sem hooks, sem interatividade — pode ser
 * renderizado no servidor (Server Component) sem problema.
 * ---------------------------------------------------------------
 */

// SVG com <feTurbulence> (filtro que gera ruído/estática — o mesmo
// tipo de efeito de "TV sem sinal") embutido como "data URI": o SVG
// inteiro vira texto e depois vira uma URL, então não precisamos de
// nenhum arquivo de imagem separado no projeto.
const SVG_RUIDO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <filter id="ruido">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ruido)" />
    </svg>`
  );

export default function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      // z-40: fica por cima do conteúdo normal da página, mas abaixo
      // da contagem regressiva (CountdownIntro usa z-50).
      // mix-blend-overlay: mistura o ruído com as cores de baixo em
      // vez de só "colar" um cinza por cima.
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.05] mix-blend-overlay"
      style={{ backgroundImage: `url("${SVG_RUIDO}")` }}
    />
  );
}
