# Spec — Hero "HelixEarth" (scroll-scrub + dissolução)

**Data:** 2026-07-12
**Autora:** Rosa (decisões) · Claude (design/implementação)
**Status:** aprovado, pronto pra implementar

## Objetivo

Reproduzir, numa **cópia paralela** do projeto (git worktree, rodando em outra
porta), o efeito de hero do site de referência [helixearth.com](https://helixearth.com/for-investors.html):
o "vídeo" da ignição do foguete é arrastado pelo scroll e, no fim, se **dissolve**
suavemente na primeira seção do site. Copy e narrativa continuam as do projeto atual.

## Descoberta que motiva o spec

- O efeito do HelixEarth **não é um `<video>`**. O `main.js` deles usa um `<canvas>`
  que desenha uma **sequência de fotogramas** (`/video/rocket-frames/frame-0001.jpg`)
  dirigida pelo scroll via **GSAP ScrollTrigger**, e faz a transição pro conteúdo
  quase toda com **opacidade + escala** (109 usos de `opacity`, 28 de `scale`).
- Arrastar um `<video>` pelo `currentTime` engasga (o navegador não busca quadro a
  quadro suavemente) — é por isso que as tentativas com vídeo ficaram ruins.
- O projeto **já tem** 123 fotogramas em `public/rocket-frames/` (~3,5 MB) e já
  implementou a técnica correta em `components/LaunchFrames.tsx`. O site no ar
  simplesmente parou de usá-la ao pivotar pro feed "Reels" com scroll-snap, que é
  um modelo de rolagem incompatível com o scrub contínuo.

## Decisões (travadas com a Rosa)

1. **Isolamento:** cópia paralela via `git worktree` numa pasta irmã, com branch
   própria. Site atual continua em `:3002`, o novo roda em `:3005`, os dois ao
   mesmo tempo. Nada da cópia toca no projeto atual.
2. **Escopo do 1º passo:** só o hero + a dissolução (não o feed inteiro de
   notícias ainda). Abaixo do hero, uma seção curta de conteúdo de exemplo só pra
   provar que a emenda funciona.
3. **A dissolução ("melt"):** os últimos quadros do foguete se dissolvem no
   **céu estrelado (`StarField`)** com o título "Notícias das Estrelas" surgindo.

## Design técnico

### Componente `HeroHelix.tsx`

Parte de `LaunchFrames.tsx` (que já faz canvas + scrub + pré-carregamento em
lotes) e acrescenta a peça que faltava: a **dissolução**. Mecânica:

- Seção "presa" na tela (`pin`) por uma distância longa de scroll (`end: "+=350%"`),
  com `scrub` pra seguir a rolagem suave (Lenis).
- Progresso 0→1 do ScrollTrigger vira índice 0→122 dos fotogramas (mesmo esquema
  do `LaunchFrames`). Só redesenha o canvas quando o índice muda.
- **Dissolução (novo):** nos últimos ~15% do progresso (`0.85 → 1.0`), o canvas do
  foguete anima `opacity 1 → 0` e `scale 1 → 1.08` (leve afastamento "pra dentro do
  céu"), enquanto o bloco de título anima `opacity 0 → 1` (+ leve subida). O
  `StarField`, fixo em `z-0` atrás de tudo, aparece naturalmente conforme o canvas
  se apaga.
- Sem `useState` para o progresso (dispara dezenas de vezes por segundo) — tudo via
  `.style` dentro do `onUpdate`, refs pra o resto (mesmo padrão dos componentes
  existentes).

### Página de demonstração

- `StarField` (fundo, `z-0`) → `HeroHelix` (o efeito) → uma seção curta de conteúdo
  de exemplo (título + 2–3 parágrafos com a copy do portal).
- `SmoothScrollProvider` (Lenis) religado no layout desta cópia.
- `body` liberado pra rolar (remover `height:100dvh; overflow:hidden` do
  `globals.css` **apenas na cópia** — isolado do projeto atual).
- Roda com `next dev -p 3005`.

### Acessibilidade

- `prefers-reduced-motion`: sem scrub nem dissolução animada — mostra o último
  quadro (foguete já no céu) e o título prontos, estáticos. Lenis também já se
  desliga sozinho nesse caso (ver `SmoothScrollProvider`).

## Reaproveitado x novo

- **Reaproveitado:** os 123 fotogramas, `StarField`, `SmoothScrollProvider` (Lenis),
  a lógica de canvas/pré-carregamento do `LaunchFrames`, a copy do portal.
- **Novo:** o trecho da dissolução em `HeroHelix.tsx`, a página de demonstração, o
  ajuste de `body` pra scroll contínuo.

## Alternativas descartadas

- **Máscara `clip-path`** pra revelar o conteúdo: mais bonita em teoria, porém
  frágil e difícil de manter por uma iniciante. O HelixEarth usa `clip-path` só
  pontualmente; o grosso é opacidade/escala.
- **Só congelar o último quadro:** não é dissolução de verdade — é o que o
  `LaunchFrames` já fazia (véu de gradiente), e é justamente o que ficou faltando.

## Fora de escopo (próximos passos)

- Trazer todas as notícias pro scroll contínuo.
- Portar o efeito de volta pro projeto principal (só depois de aprovado na cópia).
