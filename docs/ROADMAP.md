# ROADMAP — Notícias da Ciência

**Data:** 11/07/2026 · **Autora:** Rosa Maria · **Status:** para revisão da Rosa

## Visão em uma frase

Usar a mecânica de scroll que vicia as pessoas nas redes sociais para entregar **dopamina de qualidade**: notícias de ciência confiáveis, num site cinematográfico e imersivo (referências: helixearth.com/for-investors e gru.space), com algoritmo de recomendação e retenção como o das redes.

## Decisões travadas

| Tema | Decisão |
|---|---|
| Stack | Next.js 15 + TypeScript + Tailwind + GSAP/ScrollTrigger + Lenis + R3F (projeto `noticias-da-ciencia`, já criado) |
| Conteúdo | **Reescrita própria fiel aos FATOS**, sintetizada de 3+ fontes independentes por história. Nunca cópia/paráfrase de artigo único (risco jurídico). Íntegra apenas de fontes de domínio público (NASA etc.) |
| Imagens das notícias | NASA (domínio público) + Pexels (chave da Rosa em `.env` — NUNCA no código; chave antiga exposta deve ser rotacionada) |
| Login/social | Supabase (auth, curtidas, comentários) — MCP já conectado |
| Pesquisa (dev) | MCPs: Brave Search (buscar), Firecrawl (extrair), Context7 (docs) — `.mcp.json` criado, chaves pendentes |
| Atualização | Diária às 10h (cron da Vercel) |

---

## Fase 1 — Home cinematográfica 🚀 *(parcialmente prototipada)*

1. **Abertura:** timer de 3 segundos hi-tech e impactante (estética T-menos de lançamento)
2. **Hero:** vídeo real de decolagem (NASA/ESA/SpaceX — Artemis I já verificado em HD) que **decola quando a pessoa scrolla**, seção pinada via ScrollTrigger — referência forte: helixearth
3. **Pós-decolagem:** frase-gancho de alto impacto (conceito: dopamina de qualidade, enriquecimento intelectual, anti-brainrot, estimulação cognitiva) — **gerar variações com a skill de marketing e testar**
4. **Ascensão:** sensação contínua de subir ao espaço (parallax de estrelas, zoom, dissolve)
5. Tudo dinâmico e rápido — nada demorado; fluidez tipo gru.space (Lenis)

**Pronto quando:** a sequência timer → decolagem → frase → espaço roda fluida no celular e desktop, sem cortes.

## Fase 2 — Pipeline de notícias 📰

**Regras de busca (spec da Rosa, verbatim):**
- Busca web com time_range de 7 dias
- Fontes priorizadas — Primárias: NASA, ESA, Nature, Science, arXiv · Aeroespacial: SpaceNews, Space.com, SpaceflightNow, FlightGlobal, Payload · Descoberta rápida: EurekAlert!, Phys.org · Tecnologia: MIT Technology Review, IEEE Spectrum, Ars Technica, Wired · Agências: Reuters, AP, BBC Science, The Guardian
- História só entra confirmada em **3+ fontes independentes**
- Descartar o que não rastrear até paper/release/fonte primária
- Priorizar hot/trending/provocativo — nunca genérico; implicação prática real, marcos de missões, avanços de IA com impacto mensurável
- Nunca inventar conexões que os dados não sustentam

**Formato por história:** 1) Manchete curta e direta · 2) Dado científico (fato central + fonte + link) · 3) Tradução (implicação concreta no mundo real)

**Pronto quando:** rodar o pipeline gera N histórias válidas no formato, cada uma com 3+ fontes rastreáveis.

## Fase 3 — Publicação + SEO/LLMO 📄

- Artigo completo REESCRITO (fiel aos fatos, palavras nossas) + Key Takeaways + Q&A otimizados para SEO e LLMs
- Botão **"Entenda mais"** no card do feed (copy pensada pra retenção) → abre a notícia completa
- Fim do artigo: fonte principal em destaque + demais fontes que cobrem o assunto
- Fundo da página da notícia: imagem NASA/Pexels **animada e interativa** (reage ao scroll E ao cursor)
- Cron diário às 10h publica as novas histórias

**Pronto quando:** notícia publicada tem SEO completo, referências claras e fundo interativo; cron roda sozinho.

## Fase 4 — Social 💬

- Login Supabase (obrigatório só para interagir — nunca para ler: zero fricção)
- Ícones de curtir, comentar e compartilhar no feed, estilo Instagram/TikTok
- Ver comentários dos outros usuários e contagem de curtidas

**Pronto quando:** usuária loga, curte, comenta e vê os números atualizarem em tempo real.

## Fase 5 — Recomendação + Newsletter 🧠

- Rastrear curtidas/comentários por categoria de conteúdo
- Gatilho: **10 curtidas OU 5 comentários** em notícias diferentes → detectar nicho favorito → prompt de captura: "Receba notificação sempre que sair notícia de X" (copy final via skill de marketing/copywriting, otimizada pra conversão; pede SÓ o e-mail)
- E-mail diário: as **7 notícias mais relevantes** dos temas que ela mais interagiu, estrutura cativante e não-genérica, com link pra ler completo no site
- Ranking das mais comentadas/curtidas no site — e essas são as mais recomendadas (loop: mais uso → mais dados → melhor recomendação, como o algoritmo das redes)

**Pronto quando:** o gatilho dispara no momento certo, o e-mail chega bonito e os links voltam pro site.

## Fase 6 — Dashboard de métricas 📊

- Acessos, notícias mais comentadas/curtidas, conversão de newsletter, retenção por sessão
- Inspirado nas métricas de recomendação das redes sociais

**Pronto quando:** Rosa abre o dashboard e decide pauta com base em dados.

---

## Pendências da Rosa (fora do código)

- [ ] Rotacionar a chave do Pexels (a antiga vazou no chat) e colar a nova no `.env`
- [ ] Gerar chave do Brave Search e do Firecrawl e colar no `.mcp.json`
- [ ] Criar repositório no GitHub e conectar (destrava GSD/ultraplan + deploy Vercel)
