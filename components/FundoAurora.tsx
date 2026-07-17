/**
 * FundoAurora
 * ---------------------------------------------------------------
 * Duas manchas de cor gigantes e desfocadas (azul e violeta) fixas
 * atrás de todo o conteúdo, "respirando" bem devagar. É o que dá a
 * sensação de profundidade premium dos sites de referência — o fundo
 * nunca é um preto chapado, tem vida sutil.
 *
 * Componente de servidor puro (só divs com CSS — a animação vive em
 * globals.css e desliga sozinha pra quem pede reduzir movimento).
 * ---------------------------------------------------------------
 */

export default function FundoAurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Mancha azul — canto superior esquerdo */}
      <div
        className="aurora-1 absolute -top-1/4 -left-1/4 h-[70vh] w-[70vw] rounded-full opacity-[0.13]"
        style={{
          background: "radial-gradient(circle, #5b8cff 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />
      {/* Mancha violeta — canto inferior direito */}
      <div
        className="aurora-2 absolute -right-1/4 -bottom-1/4 h-[70vh] w-[70vw] rounded-full opacity-[0.1]"
        style={{
          background: "radial-gradient(circle, #a78bfa 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
      />
    </div>
  );
}
