# PLANO DE REDESIGN — Portal de Notícias Scrollytelling

**Data:** 12/07/2026 · **Status:** aprovado para execução em etapas
**Complementa o** `ROADMAP.md` (não substitui — este plano detalha COMO entregar a Fase 1 + o feed, que é o coração do site)

## Visão (palavras da Rosa)

Um portal de notícias moderno de **ciência, setor aeroespacial e tecnologia**, com scrollytelling:

1. **Hero:** o vídeo do motor de foguete ignitando (o novo, de close-up) — a pessoa scrolla e vê a ignição acontecer, com título e subtítulo de impacto que já ancoram o propósito do site.
2. **Ancoragem:** seção seguinte apresenta o portal em poucas palavras.
3. **Feed scrollytelling:** cards de notícias entram deslizando lateralmente, de forma elegante — manchete + descrição breve + imagem de capa. Scroll longo, simulando o feed de Instagram/TikTok, mas com identidade própria (entrada lateral animada, não lista linear).
4. **Clique no card** → página da notícia completa (`/noticia/[slug]`).
5. Responsivo (desktop + mobile). Foco total no front primeiro; backend (scraping/pipeline) fica pra depois.

---

## Diagnóstico do que existe hoje

### ✅ Aproveitar (já está bom e alinhado)

| Item | Por quê |
|---|---|
| `components/LaunchFrames.tsx` | A técnica do hero (sequência de frames num canvas dirigida pelo scroll) é **exatamente a mesma do helixearth**. Já funciona, tem acessibilidade (prefers-reduced-motion), carregamento progressivo e composição mobile. Só trocamos os frames pelo novo vídeo e a copy. |
| `components/SmoothScrollProvider.tsx` (Lenis) | Scroll suave já integrado ao GSAP. |
| `components/CountdownIntro.tsx` | Funciona. **Recomendação:** mostrar só na primeira visita da sessão (sessionStorage) — intro de 3s a cada visita irrita quem volta pra ler notícia. |
| `components/GrainOverlay.tsx`, `StarField.tsx` | Textura e clima — leves, mantêm. |
| Tokens de design em `globals.css` + fontes (Chakra Petch / Sora / IBM Plex Mono) | Base sólida "telemetria de missão". Vamos **expandir** (tons de card, bordas, glow) sem recomeçar. |
| `components/frase-gancho.ts` | "Seu feed de conhecimento" — vira candidato a subtítulo do hero. |
| Stack Next.js 15 + TS + Tailwind 4 + GSAP/ScrollTrigger + Lenis | **É a stack certa para scrollytelling.** Não troca. |

### ❌ Remover (peso morto — CONFIRMAR com a Rosa antes de deletar)

| Item | Motivo |
|---|---|
| `components/RocketScene.tsx`, `HeroScene.tsx`, `LaunchHero.tsx` | Não são importados por nenhuma página. Eram a tentativa 3D antiga. |
| Dependências `three`, `@react-three/fiber`, `@react-three/drei` | Só usadas pelos componentes mortos acima. Centenas de KB fora do bundle. |
| Dependência `framer-motion` | Não é usada em lugar nenhum. GSAP cobre tudo — uma biblioteca de animação só, sem duplicidade. |
| `close-up-shot-of-rocket-engine...(1).mp4` (11,67 MB, raiz do projeto) | Depois de extrair os frames, mover pra fora do repositório (nunca commitar vídeo de 11 MB no git). Guardar no Drive. |
| Frames antigos `public/rocket-frames/` (275 jpg, 5,16 MB) | Substituídos pelos frames do vídeo novo. |

---

## Vídeo do hero — estratégia de otimização

**Decisão: manter a técnica de frames (não usar `<video>`).** Motivo: "scrubbing" de vídeo (avançar/voltar o vídeo conforme o scroll) é instável no iOS/Safari e em celulares fracos. Sequência de frames em canvas é o padrão da indústria (Apple usa nos sites de produto) e já está implementada aqui. A conversão que a Rosa pediu ("webp ou algo mais otimizado") vira: **frames WebP** — mais leves que JPG com a mesma qualidade.

**Pré-requisito:** instalar ffmpeg (conversor de áudio/vídeo por linha de comando — não está instalado):

```powershell
winget install --id Gyan.FFmpeg
# fechar e reabrir o terminal depois de instalar
```

**Extração (rodar na raiz do projeto):**

```powershell
# 1) Descobrir duração/fps do vídeo
ffprobe -v quiet -show_entries "format=duration:stream=width,height,r_frame_rate" -of default=noprint_wrappers=1 ".\close-up-shot-of-rocket-engine-ignition-powerful-2026-01-28-05-20-41-utc (1).mp4"

# 2) Extrair ~120 frames WebP, 1600px de largura (ajustar fps= pela duração: fps = 120 / duração_em_segundos)
ffmpeg -i ".\close-up-shot-of-rocket-engine-ignition-powerful-2026-01-28-05-20-41-utc (1).mp4" -vf "fps=12,scale=1600:-2" -c:v libwebp -quality 68 "public\rocket-frames\frame-%04d.webp"
```

**Metas:** ~120 frames · ~15–25 KB cada · **total ≤ 3 MB** (os 275 JPG atuais somam 5,16 MB — dá pra ficar mais leve E mais bonito). Se passar de 3 MB, baixar `-quality` para 60 ou largura para 1280.

**Ajustes no `LaunchFrames.tsx`:** `TOTAL_DE_FRAMES = 120`, extensão `.webp`, novo `INDICE_DO_POSTER` (escolher um frame bonito pré-ignição), recalibrar os pontos do timeline (título some / frase entra) pro ritmo do vídeo novo.

## Copy do hero (título + subtítulo de impacto)

Decidir na execução — 3 candidatos (Rosa escolhe ou pedimos variações à skill de marketing):

1. **"O universo não espera."** / sub: "Ciência, espaço e tecnologia — as descobertas que importam, todos os dias."
2. **"Dopamina de qualidade."** / sub: "Seu feed de conhecimento: ciência real, direto da fonte."
3. **"A próxima descoberta já começou."** / sub: "Notícias de ciência, aeroespacial e tecnologia em uma experiência imersiva."

---

## Arquitetura do site (foco front)

```
app/
  page.tsx                 → Home: CountdownIntro (1ª visita) + HeroFrames + PortalIntro + NewsFeed
  noticia/[slug]/page.tsx  → Página da notícia completa (server component, SEO)
  layout.tsx               → (como está) fontes + Lenis + grain
components/
  LaunchFrames.tsx         → hero (frames novos + copy nova)
  PortalIntro.tsx          → NOVO: seção de ancoragem (texto breve + transição)
  NewsFeed.tsx             → NOVO: orquestra o feed scrollytelling
  NewsCard.tsx             → NOVO: card individual (manchete, resumo, imagem, categoria)
content/
  noticias.ts              → NOVO: 12 notícias MOCK tipadas (dados de exemplo realistas)
```

**Tipo da notícia (contrato que o backend futuro vai preencher):**

```ts
type Noticia = {
  slug: string;          // ex.: "jwst-agua-exoplaneta-rochoso"
  categoria: "espaço" | "tecnologia" | "física" | "biologia" | "ia";
  manchete: string;      // curta e direta
  resumo: string;        // 1-2 frases pro card
  imagem: string;        // capa (NASA domínio público nos mocks)
  dataISO: string;
  corpo: string[];       // parágrafos do artigo reescrito
  dadoCientifico: { fato: string; fonte: string; url: string };
  traducao: string;      // implicação concreta no mundo real
  fontes: { nome: string; url: string }[];
};
```

**Animação do feed (GSAP ScrollTrigger):**
- Desktop: cards alternam entrada da esquerda/direita com `x: ±80, opacity: 0 → 0`, leve rotação (1–2°) e stagger; parallax sutil na imagem de capa dentro do card.
- Mobile: coluna única, entrada `y: 40 + fade` (lateral em tela estreita corta conteúdo e enjoa).
- `prefers-reduced-motion`: cards aparecem sem deslocamento, só fade.
- Imagens via `next/image` (otimização automática) com `sizes` correto.
- **Não** pinar o feed — pin é só no hero. O feed é scroll livre e longo (sensação de feed infinito), animação disparada por posição (`ScrollTrigger.batch`).

**Página da notícia:** server component (SEO de verdade — o HTML já chega pronto pro Google), `generateMetadata` por slug, manchete + dado científico + tradução + corpo + fontes no fim. Fundo interativo (Fase 3 do roadmap) fica pra depois.

---

## Etapas de execução (economia de sessão/tokens)

> Modo de trabalho: Claude orquestra e delega o grosso da escrita de código para subagentes econômicos; revisa e integra. Uma etapa por vez; cada etapa termina com commit.

**Etapa 1 — Fundação limpa + hero novo** *(próxima sessão)*
1. Rosa confirma as deleções da lista acima → remover componentes mortos + `npm uninstall three @react-three/fiber @react-three/drei framer-motion`
2. Instalar ffmpeg, extrair frames WebP do vídeo novo, mover o .mp4 pra fora do repo
3. Adaptar `LaunchFrames` (contagem, extensão, poster, timings) + copy nova do hero
4. Testar em desktop + mobile (DevTools) → commit

**Etapa 2 — Feed scrollytelling** *(a maior)*
1. `content/noticias.ts` com 12 mocks realistas (imagens NASA)
2. `PortalIntro` + `NewsFeed` + `NewsCard` com as animações descritas
3. Home montada de ponta a ponta → commit

**Etapa 3 — Página da notícia**
1. `/noticia/[slug]` + `generateMetadata` + layout de leitura confortável
2. Link dos cards ("Entenda mais") → commit

**Etapa 4 — Polish + QA**
1. Microinterações (hover dos cards, transições), estados de foco (acessibilidade)
2. Lighthouse (performance + SEO), teste real no celular
3. CountdownIntro só na 1ª visita → commit

Depois disso: Fase 2 do roadmap (pipeline real de notícias) substitui os mocks — o contrato `Noticia` já estará pronto pra receber.

## Pendências da Rosa (continuam valendo, do ROADMAP)

- [ ] Rotacionar chave do Pexels · [ ] Chaves Brave/Firecrawl no `.mcp.json` · [ ] Repositório no GitHub (destrava deploy Vercel)
