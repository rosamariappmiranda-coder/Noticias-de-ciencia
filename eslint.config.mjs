import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Desligamos SÓ esta regra de propósito. Ela pede pra trocar <a>
    // por <Link> em links internos — o que normalmente é bom. Mas aqui
    // usamos <a> de caso pensado: forçar o recarregamento COMPLETO da
    // página evita um conflito conhecido entre o GSAP (animação do
    // foguete, com pin) e a remontagem de componentes do React ao
    // navegar. O resto das regras continua ligado.
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
