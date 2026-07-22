# Spec — Etapa "Feed Reels" (pivô de layout aprovado pela Rosa em 12/07/2026)

## Objetivo

Transformar a experiência do site de "blog com scrollytelling" em **feed vertical estilo
TikTok/Reels**: cada notícia ocupa a tela inteira e cada gesto de rolagem encaixa
exatamente na próxima notícia. Deve funcionar perfeitamente em mobile (swipe) e
desktop (roda do mouse, setas, PageDown).

## Contexto do projeto

- Next.js 15 (App Router) + Tailwind CSS 4. Tema escuro espacial, variáveis CSS em
  `app/globals.css` (`--surface`, `--text`, `--text-dim`, `--accent`), fontes utilitárias
  `font-display` e `font-telemetry` já configuradas.
- Notícias mockadas em `content/noticias.ts` (12 itens, tipo `Noticia` com `slug`,
  `categoria`, `manchete`, `resumo`, `dataISO`, `imagem`).
- Frames da ignição do foguete em `public/rocket-frames/frame-0001.webp` até
  `frame-0123.webp` (123 frames). Função de caminho já existe em
  `components/LaunchFrames.tsx` — **ler esse arquivo antes** para reaproveitar os
  padrões de canvas/preload (desenho "cover", carregamento em lotes, poster).
- `components/CountdownIntro.tsx` (painel T-10s no canto) e `components/StarField.tsx`
  (fundo de estrelas fixo) continuam como estão — são overlays fixos, compatíveis.
- Código comentado em português, estilo didático (a dona do projeto está aprendendo).
  Manter esse padrão em TODO arquivo novo: comentários explicando O QUE e POR QUE.

## Arquitetura da mudança

### 1. `components/ReelsFeed.tsx` (novo, "use client")

O contêiner do feed. Estrutura:

- Um `<div>` raiz `fixed inset-0` com `h-dvh w-full overflow-y-auto` e scroll-snap:
  `snap-y snap-mandatory` + `overscroll-contain` (impede "vazamento" de scroll pro body).
  Esse contêiner é O scroller da página inteira agora (o body não rola mais).
  - z-index acima do StarField (que é z-0) mas abaixo dos overlays fixos
    (CountdownIntro/contadores usam z-9+): usar `z-[1]`.
  - Fundo transparente para o StarField continuar aparecendo nas bordas/gradientes.
- Filhos: primeiro o `<HeroReel />` (slide 0), depois um `<NewsReel />` por notícia.
- Cada slide: `h-dvh w-full snap-start snap-always relative` (`snap-always` =
  `scroll-snap-stop: always`, força parar em CADA notícia, sem pular várias de uma vez —
  é isso que dá a sensação TikTok de "um gesto = um card").
- **Detecção do slide ativo** via `IntersectionObserver` (threshold 0.6) no próprio
  contêiner (`root` = o div do feed): guarda `indiceAtivo` em estado React.
  Usos do índice ativo:
  - contador fixo "03 / 13" (posição: canto inferior direito, mesma estética
    `font-telemetry`, `tabular-nums`, tracking largo do resto do site);
  - bolinhas de navegação na lateral direita (só em `md:` pra cima): uma bolinha por
    slide, a ativa fica maior/acesa (`bg-[var(--accent)]`), clicáveis — clique faz
    `scrollIntoView({ behavior: "smooth" })` no slide correspondente. Cada bolinha com
    `aria-label` descritivo ("Ir para notícia X: manchete").
  - classe/atributo `data-ativo` no slide ativo para disparar a animação de entrada
    do texto (ver NewsReel).
- Dica de rolagem: no slide 0, um chevron animado (CSS `animate-bounce`) com o texto
  "role para explorar" em `font-telemetry`, some quando `indiceAtivo > 0`.
- Acessibilidade: contêiner com `role="feed"` e `aria-label="Feed de notícias"`;
  respeitar `prefers-reduced-motion` (sem animações de entrada; scrollIntoView com
  `behavior: "auto"`).
- Teclado: o contêiner scrollável é focável por padrão? Não — adicionar `tabIndex={-1}`
  não resolve setas. Solução simples: listener de `keydown` no `window` para
  `ArrowDown`/`ArrowUp`/`PageDown`/`PageUp` chamando scrollIntoView do próximo/anterior
  (preventDefault). Espaço deixar quieto.

### 2. `components/NewsReel.tsx` (novo — pode ser função pura, sem hooks)

Um slide de notícia tela cheia, estilo Reels:

- Fundo: `next/image` com `fill`, `object-cover`, `sizes="100vw"`. As DUAS primeiras
  notícias com `priority` (aparecem cedo); as demais lazy (padrão).
- Véu de contraste: gradiente de baixo pra cima
  (`bg-gradient-to-t from-black/85 via-black/30 to-black/10`) cobrindo o slide inteiro —
  garante leitura do texto sobre qualquer imagem.
- Conteúdo ancorado embaixo (`absolute inset-x-0 bottom-0`), com padding generoso e
  `max-w-2xl` centralizado ou alinhado à esquerda em telas grandes:
  - categoria (`font-telemetry`, uppercase, tracking largo, cor `--accent`);
  - manchete grande (`font-display`, `text-3xl md:text-5xl`, `text-balance` se disponível);
  - resumo (`text-sm md:text-base`, cor `--text-dim`, máx ~3 linhas com `line-clamp-3`);
  - linha final: data formatada em pt-BR (copiar helper `formatarData` do
    `components/NewsCard.tsx`) + link `Entenda mais →` para `/noticia/{slug}`
    (a página ainda não existe — tudo bem, é a próxima etapa).
- Animação de entrada do texto quando o slide fica ativo: bloco de texto começa com
  `opacity-0 translate-y-6` e transiciona para `opacity-100 translate-y-0`
  (`transition duration-700`) quando o slide tem `data-ativo` — puro CSS via seletor
  (ex.: `[data-ativo="true"] .conteudo-reel { ... }` no globals.css, OU passar prop
  `ativo: boolean` e trocar classes — escolher o mais simples). Com
  `prefers-reduced-motion`, texto sempre visível (media query no CSS).
- Respeitar `env(safe-area-inset-bottom)` no padding inferior (celulares com barra
  gestual): `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` ou similar.

### 3. `components/HeroReel.tsx` (novo, "use client")

Slide 0: a ignição do foguete tocando **por tempo** (não mais por scroll):

- Canvas cobrindo o slide (mesma técnica de desenho "cover" e preload em lotes do
  `LaunchFrames.tsx` — reaproveitar a lógica adaptando, NÃO importar o componente).
- Comportamento: desenha o poster (frame ~1) imediatamente; pré-carrega os 123 frames
  em lotes; quando todos os frames estiverem prontos, toca a sequência UMA vez via
  `requestAnimationFrame` a ~24 fps (123 frames ≈ 5s) e congela no último frame.
- `prefers-reduced-motion`: sem playback — desenha direto o último frame.
- Overlay de texto no terço inferior (mesma âncora dos NewsReel): nome do portal +
  tagline curta de apresentação (aproveitar/adaptar o texto do
  `components/PortalIntro.tsx` — ler antes; o PortalIntro deixará de ser renderizado).

### 4. `app/page.tsx` (modificar)

```tsx
<>
  <StarField />
  <CountdownIntro />
  <ReelsFeed />   {/* contém HeroReel + um NewsReel por notícia */}
</>
```

- `LaunchFrames`, `PortalIntro` e `NewsFeed` saem do JSX mas os ARQUIVOS FICAM no
  repositório (deleção só com confirmação da Rosa — regra do projeto).

### 5. `app/layout.tsx` (modificar)

- Remover o wrapper `<SmoothScrollProvider>` (Lenis briga com scroll-snap: ele anima o
  scroll do body via roda do mouse e impede o encaixe nativo). O arquivo fica no repo.

### 6. `app/globals.css` (modificar)

- Adicionar `overflow: hidden` no `body` (quem rola agora é o contêiner do feed) e
  `height: 100dvh`.
- Se optar pela animação de entrada via atributo: adicionar as regras
  `[data-ativo] ...` + media query de reduced motion aqui, comentadas.
- NÃO remover nada existente sem necessidade.

## Restrições

- NÃO instalar nenhum pacote novo. NÃO deletar nenhum arquivo.
- NÃO usar GSAP/ScrollTrigger nos componentes novos (IntersectionObserver + CSS dão conta).
- `npm run build` DEVE passar ao final (atenção: se o build falhar com erro EINVAL de
  readlink no `.next`, é o cache corrompido pelo OneDrive — apagar a pasta `.next` e
  rodar de novo resolve).
- Não commitar (o orquestrador revisa e commita).

## Critérios de aceite

1. Página inicial abre no slide do foguete; ignição toca sozinha e congela no fim.
2. Um gesto de scroll (roda/swipe/seta) leva EXATAMENTE ao próximo slide, encaixado.
3. Cada notícia ocupa a tela inteira com imagem de fundo, texto legível e link.
4. Contador "NN / 13" atualiza conforme navega; bolinhas (desktop) navegam ao clicar.
5. Texto do slide ativo entra com fade+subida; com reduced-motion, sem animação.
6. Sem scroll horizontal, sem barra de rolagem dupla, sem Lenis ativo.
7. `npm run build` verde.
