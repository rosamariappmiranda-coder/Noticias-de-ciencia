# Spec pronta para o agente da Etapa 2 (feed scrollytelling)

> Uso: despachar um agente `general-purpose` (modelo sonnet) com o prompt abaixo, verbatim.
> Escrita em 12/07/2026, quando o classificador de permissões caiu no meio da execução.

---

Você vai implementar a "Etapa 2 — Feed scrollytelling" do projeto Next.js em:
c:\Users\rosam\OneDrive\Documentos\Rosa Maria - Criação de Conteúdo\noticias-da-ciencia

CONTEXTO OBRIGATÓRIO — leia antes de codar:
1. docs/PLANO-REDESIGN.md (o plano aprovado — seção "Arquitetura do site" e "Animação do feed")
2. components/LaunchFrames.tsx (referência de estilo de código: comentários educacionais em português brasileiro explicando O QUE cada bloco faz — a dona do projeto é iniciante em programação; siga exatamente esse estilo em TODO código novo)
3. app/globals.css (tokens de design) e app/page.tsx (estrutura atual)

O QUE CONSTRUIR (sem instalar NENHUMA dependência nova — GSAP/ScrollTrigger e Lenis já estão instalados):

A) content/noticias.ts — array tipado com o type Noticia exatamente como definido no plano (slug, categoria, manchete, resumo, imagem, dataISO, corpo, dadoCientifico, traducao, fontes). Criar 12 notícias MOCK realistas em português brasileiro sobre ciência/espaço/tecnologia (podem ser baseadas em fatos reais conhecidos: JWST, Artemis, SpaceX Starship, fusão nuclear, IA, CRISPR etc. — corpo com 4-6 parágrafos cada). IMPORTANTE sobre imagens: use URLs do site images-assets.nasa.gov (biblioteca de imagens da NASA, domínio público) no formato https://images-assets.nasa.gov/image/{nasa_id}/{nasa_id}~medium.jpg — descubra nasa_ids reais consultando a API pública https://images-api.nasa.gov/search?q=TERMO&media_type=image e VERIFIQUE cada URL final com um request real (Invoke-WebRequest -Method Head) — só inclua URLs que respondem 200. Se não conseguir 12 URLs válidas distintas, pode repetir algumas. Adicione o domínio em next.config.ts via images.remotePatterns.

B) components/PortalIntro.tsx — seção de ancoragem pós-hero: texto breve e forte apresentando o portal ("Seu feed de conhecimento" está em components/frase-gancho.ts e já aparece no hero; aqui aprofunde em 2-3 frases: notícias de ciência, espaço e tecnologia verificadas em múltiplas fontes, sem clickbait). Tipografia grande (font-display), fade+rise sutil no scroll via GSAP ScrollTrigger. Client component.

C) components/NewsCard.tsx — card de notícia: imagem de capa (next/image com sizes correto), tag de categoria (font-telemetry, uppercase, tracking largo, cor var(--accent)), manchete (font-display), resumo (text-dim), data formatada em pt-BR, e um botão/link "Entenda mais →" que navega para /noticia/[slug] (use next/link envolvendo o card inteiro). Visual: fundo var(--surface), borda border-white/10, rounded-2xl, glow azul sutil no hover (shadow com rgba(91,140,255,...)), leve scale/translate no hover com transition CSS.

D) components/NewsFeed.tsx — client component que renderiza a lista de NewsCard com scrollytelling GSAP:
- Desktop (≥768px): cards alternam entrada da esquerda/direita (x: ±80, opacity 0→1, rotação 1.5° que zera ao entrar), via ScrollTrigger com start "top 85%", toggleActions "play none none reverse" ou ScrollTrigger.batch
- Mobile: entrada y:40 + fade apenas
- prefers-reduced-motion: sem deslocamento nenhum, só fade — siga o padrão de acessibilidade do LaunchFrames.tsx
- NÃO pinar nada — scroll livre. Layout: uma coluna central max-w-2xl com os cards alternando levemente o alinhamento (desktop), coluna única no mobile. Espaçamento generoso entre cards (feed longo, respiro)
- Registrar o plugin com gsap.registerPlugin(ScrollTrigger) e limpar os triggers no unmount

E) app/page.tsx — substituir a seção de card fake atual por: <PortalIntro /> seguido de <NewsFeed /> (mantendo StarField, CountdownIntro e LaunchFrames como estão). Ajustar comentários.

F) NÃO criar a página /noticia/[slug] ainda (é a Etapa 3) — mas o link dos cards já deve apontar pra lá.

VERIFICAÇÃO OBRIGATÓRIA antes de terminar:
- npm run build precisa passar SEM erros (rode e corrija o que aparecer)
- NÃO commitar nada no git
- NÃO deletar nenhum arquivo existente

RETORNO: liste os arquivos criados/alterados, o resultado do build, quantas URLs de imagem NASA foram verificadas com 200, e qualquer decisão que você tomou diferente do especificado (com o motivo).
