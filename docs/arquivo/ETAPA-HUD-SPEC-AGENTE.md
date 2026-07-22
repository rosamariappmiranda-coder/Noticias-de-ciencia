# Spec — Etapa "Centro de Comando" (polish visual do feed Reels)

Aprovada pela Rosa em 12/07/2026. Feedback dela sobre o feed atual: "ficou com muita
cara de blog — queremos algo fluido, interativo, tech". Referências do roadmap
(docs/ROADMAP.md, Fase 1): helixearth.com e gru.space — cinematográfico, imersivo,
scrollytelling de verdade.

## Direção de design (comprometer 100%, sem meio-termo)

**"Centro de Comando de Missão"**: a pessoa não está lendo um blog — está numa
console de telemetria assistindo notícias chegarem do espaço. Tudo que for cromo de
interface (contadores, réguas, tags, botões) usa a fonte mono (`font-telemetry`,
IBM Plex Mono), caixa alta, tracking largo, colchetes e linhas finas. O conteúdo
(manchete, resumo) continua humano e legível (Chakra Petch + Sora). Paleta existente
em `app/globals.css` (`--accent` azul #5b8cff, `--exhaust` âmbar SÓ para fogo/motor).

Regra de ouro: nada de elemento "flutuando sem função". Cada cromo parece
instrumento: tem rótulo, valor e unidade.

## Arquivos e mudanças

### 1. `components/ReelsFeed.tsx` (modificar)

**a) Moldura HUD fixa** (novo, dentro do contêiner, `aria-hidden`, pointer-events-none):
4 cantoneiras em "L" nos cantos da tela (`fixed`, z-[2]), feitas com 2 traços de
`border` (ex.: div 20×20px com border-l + border-t, branco 15% de opacidade,
1px). Margem ~14px das bordas (respeitar safe-area). Em telas < sm, 12×12px.
Discretas — moldura de visor, não caixa.

**b) Trilho de altitude** (substitui as bolinhas no desktop):
- Coluna fixa à direita (`md:flex`), centralizada verticalmente: uma linha vertical
  fina (1px, branco/15) de ~40vh com marcas (ticks) — um `<button>` por slide,
  posicionado ao longo do trilho (flex column justify-between funciona).
- Cada tick: traço horizontal de 10px (ativo: 18px, cor `--accent`, com glow
  `box-shadow: 0 0 8px`); manter `aria-label`/`aria-current` como as bolinhas tinham.
- Ao lado do tick ativo, rótulo mono minúsculo com o número do slide (`02`).

**c) Bloco de telemetria** (evolui o contador atual, canto inferior direito):
três linhas mono de 10-11px, alinhadas à direita:
```
FEED     03 / 14
ALT      +082 KM
SINAL    ● ATIVO
```
- ALT = altitude fictícia que cresce com o slide: `indiceAtivo * 34` km, formatada
  `String(...).padStart(3, "0")` — materializa a "ascensão" do roadmap (a pessoa
  SOBE conforme navega). No slide 0: `+000 KM`.
- O ● pisca devagar (CSS `animation: pulso 2s infinite`; definir keyframes no
  globals.css; desligar via prefers-reduced-motion).
- Rótulos em branco/40, valores em `--text-dim`, `tabular-nums`.

**d) Novo slide 1 = `<HookReel />`** (ver §3) entre o HeroReel e as notícias.
TOTAL_DE_SLIDES vira `noticias.length + 2`. Ajustar índices (notícias começam no 2),
aria-labels e o rótulo do trilho. Contador exibe o total novo.

### 2. `components/NewsReel.tsx` (modificar) — o coração do "des-blogar"

**a) Ken Burns na imagem:** embrulhar o `<Image>` num `<div>` `absolute inset-0
overflow-hidden` com classe `midia-reel` no filho que escala. A imagem começa
`scale(1.08)` e vai a `scale(1)` em ~6s ease-out quando o slide está ativo (CSS em
globals.css via `[data-ativo="true"] .midia-reel`). Reduced motion: sem escala.

**b) Entrada em cascata:** trocar a animação única do `.conteudo-reel` por revelação
escalonada: cada bloco filho ganha classe `linha-reel` e o CSS aplica
`transition-delay` crescente via `:nth-child` (80ms entre linhas). A manchete usa
revelação por recorte: `clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)` (0.8s)
além do fade/subida. Tudo revertendo quando o slide desativa (pra reanimar ao voltar).

**c) Cromo do slide:**
- Acima da categoria, uma **linha-régua** horizontal fina que cresce de 0 a 56px
  (`scaleX`, transform-origin left) quando ativo, cor `--accent`.
- Categoria vira tag mono entre colchetes: `[ ASTROFÍSICA ]` (os colchetes são
  texto mesmo), com `text-shadow` leve de glow azul.
- **Número fantasma:** o índice da notícia (prop nova `numero: number`, formatado
  `02`) gigante — `font-display`, ~`text-[26vh]`, `leading-none`, posicionado
  `absolute right-[-2mm] top-[10vh]` (desktop; no mobile menor e mais transparente),
  vazado: `color: transparent` + `-webkit-text-stroke: 1px rgba(255,255,255,0.07)`
  (definir classe `.numero-fantasma` no globals.css com fallback `color:
  rgba(255,255,255,0.04)` para navegadores sem text-stroke). `aria-hidden`,
  atrás do texto (z-index menor que o conteúdo).
- Linha de rodapé do slide: data mono + separador `·` + **CTA terminal**:
  `<Link>` com borda 1px branco/20, padding compacto, mono uppercase
  `ENTENDA MAIS ↗`, hover: borda `--accent`, fundo accent/10, seta desloca 2px.
  Área de toque ≥ 44px de altura (padding suficiente).

**d) Profundidade do véu:** manter o gradiente atual e ADICIONAR um segundo véu
lateral sutil (`bg-gradient-to-r from-black/40 via-transparent to-transparent`) —
dá leitura melhor no texto à esquerda e profundidade cinematográfica.

### 3. `components/HookReel.tsx` (NOVO — sem imagem, tipografia pura)

O slide-gancho pós-decolagem que o roadmap (Fase 1, item 3) pede: alto impacto,
conceito "dopamina de qualidade / anti-brainrot".

- Fundo: transparente (o StarField aparece — sensação de já estar no espaço) + um
  glow radial central MUITO sutil (`radial-gradient(ellipse at center,
  rgba(91,140,255,0.08), transparent 60%)`).
- Composição centrada, `max-w-3xl`:
  - linha mono pequena: `// TRANSMISSÃO DO CENTRO DE COMANDO`
  - Frase principal (font-display, `text-4xl md:text-7xl`, quebrada em 3 linhas,
    cada linha é uma `linha-reel` pra entrada em cascata):
    **"Seu cérebro merece / um scroll / melhor."** — com "melhor." em `--accent`.
  - Subfrase (Sora, `--text-dim`, max-w-md): "Dopamina de qualidade: ciência real,
    verificada em 3+ fontes, direto do espaço pro seu feed."
- Deixar em comentário no arquivo 2 variações da frase principal pra Rosa testar
  depois (roadmap pede variações): "O algoritmo te empurra pra baixo. / Nós te
  lançamos / pra cima." · "Menos brainrot. / Mais / universo."

### 4. `components/HeroReel.tsx` (modificar)

- **Status de telemetria** acima do título (mono, 11px, tracking largo, com um ●):
  o componente ganha um `useState` de fase da missão sincronizado com o playback já
  existente: `"PRONTO PARA LANÇAMENTO"` (antes de tocar) → `"IGNIÇÃO"` (começou) →
  `"TORRE LIVRE — BOA VIAGEM"` (congelou no último frame). Com reduced-motion vai
  direto pra última. Trocas via callback simples nos pontos onde o código já decide
  tocar/terminar (não mexer na lógica de canvas em si).
- Título: caixa alta + `tracking-[0.08em]`; acima dele a mesma linha-régua de 56px
  dos NewsReel (consistência).
- Tagline atual vira mono: `CIÊNCIA · ESPAÇO · TECNOLOGIA — SEM ENROLAÇÃO`.

### 5. `app/globals.css` (modificar)

Adicionar (tudo comentado didaticamente, em pt-BR):
- keyframes `pulso` (opacity 1 → 0.25 → 1) pro ● de sinal;
- regras do Ken Burns (`.midia-reel`), da cascata (`.linha-reel` +
  `[data-ativo="true"] ... :nth-child` delays), do clip-path da manchete
  (`.manchete-reel`), da linha-régua (`.regua-reel`) e do `.numero-fantasma`;
- bloco `@media (prefers-reduced-motion: reduce)` cobrindo TODAS as novidades
  (sem escala, sem clip-path, sem delays, sem pulso — tudo visível direto).

## Restrições

- NÃO instalar pacotes; NÃO deletar arquivos; NÃO mexer em CountdownIntro.tsx,
  StarField.tsx, GrainOverlay.tsx nem nos componentes órfãos (NewsFeed, NewsCard,
  LaunchFrames, PortalIntro, SmoothScrollProvider).
- NÃO usar GSAP nos componentes do feed (CSS + IntersectionObserver dão conta).
- Manter todos os padrões de acessibilidade já existentes (roles, aria-*,
  reduced-motion) e os comentários didáticos em português em TUDO que criar/alterar.
- `npm run build` DEVE passar (se der EINVAL/readlink no .next: apagar .next e
  rebuildar — cache corrompido pelo OneDrive).
- Não commitar (o orquestrador revisa e commita).

## Critérios de aceite

1. Moldura HUD nos 4 cantos, discreta, sem capturar cliques.
2. Trilho de altitude substitui as bolinhas (desktop), com tick ativo em destaque e
   navegação por clique funcionando; contador vira bloco FEED/ALT/SINAL e a ALT
   sobe conforme avança no feed.
3. Slide 1 é o HookReel com a frase de impacto em cascata; notícias começam no
   slide 2 e o total exibido é 14.
4. Slide de notícia ativo: foto faz zoom lento, texto entra em cascata (categoria →
   manchete com recorte → resumo → rodapé), número fantasma gigante ao fundo,
   categoria em colchetes, CTA em botão terminal com hover.
5. Hero mostra o status PRONTO → IGNIÇÃO → TORRE LIVRE sincronizado com o vídeo.
6. Com prefers-reduced-motion: nenhum zoom/cascata/pulso — tudo estático e legível.
7. `npm run build` verde.
