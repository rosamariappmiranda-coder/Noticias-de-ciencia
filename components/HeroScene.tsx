"use client";

/**
 * HeroScene
 * ---------------------------------------------------------------
 * Seção de exemplo: fica "presa" (pin) na tela enquanto a pessoa
 * rola, e uma esfera 3D (placeholder) gira/sobe conforme o
 * progresso do scroll. Troque <EsferaPlaceholder> pela sua Lua 3D
 * quando ela estiver pronta — o resto (o "motor" de scroll) não
 * precisa mudar.
 * ---------------------------------------------------------------
 */

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

/**
 * A esfera 3D. Recebe uma "ref" com o progresso do scroll (0 a 1).
 *
 * Por que uma ref e não um useState? Porque o scroll dispara MUITAS
 * vezes por segundo — se guardássemos o progresso em useState, o
 * React re-renderizaria o componente a cada pixel rolado (lento).
 * Com uma ref, o Three.js lê o valor mais recente a cada quadro
 * (useFrame), sem nunca re-renderizar o React. Muito mais rápido.
 */
function EsferaPlaceholder({
  progressoRef,
}: {
  progressoRef: React.MutableRefObject<number>;
}) {
  const malha = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!malha.current) return;
    const p = progressoRef.current;
    malha.current.rotation.y = p * Math.PI * 2; // 1 volta completa até o fim
    malha.current.rotation.x = p * Math.PI * 0.5;
    malha.current.position.y = -0.6 + p * 1.2; // sobe levemente
  });

  return (
    <mesh ref={malha}>
      <sphereGeometry args={[1.4, 64, 64]} />
      <meshStandardMaterial color="#6ea8ff" roughness={0.35} metalness={0.6} />
    </mesh>
  );
}

export default function HeroScene() {
  const secaoRef = useRef<HTMLElement>(null);
  const progressoRef = useRef(0);

  useEffect(() => {
    if (!secaoRef.current) return;

    // ScrollTrigger "prende" a seção na tela (pin: true) durante
    // 2500px de rolagem, e onUpdate nos avisa o progresso (0→1)
    // a cada quadro — isso é o que move a esfera.
    const trigger = ScrollTrigger.create({
      trigger: secaoRef.current,
      start: "top top",
      end: "+=2500",
      pin: true,
      scrub: 1, // a animação "gruda" na posição do scroll (não solta)
      onUpdate: (self) => {
        progressoRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section
      ref={secaoRef}
      className="relative h-screen w-full overflow-hidden bg-[#04050a]"
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 2]} intensity={1.6} />
        <EsferaPlaceholder progressoRef={progressoRef} />
        <Environment preset="night" />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-24 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">
          Ciência em órbita
        </h1>
        <p className="mt-3 max-w-md text-white/70">
          Role para explorar — esta esfera é um placeholder, pronta
          para virar a sua Lua 3D.
        </p>
      </div>
    </section>
  );
}
