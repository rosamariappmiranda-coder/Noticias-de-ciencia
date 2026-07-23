# NEXO — noticias-da-ciencia

Portal de notícias de ciência e tecnologia. Feed personalizado por algoritmo,
estética cinematográfica. No ar em **rosamaria.space** (Vercel, projeto
`noticias-de-ciencia-2ax8`).

Roadmap completo: `docs/ROADMAP.md`. Specs de etapas concluídas: `docs/arquivo/`.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · GSAP/ScrollTrigger
· Lenis · Supabase (auth + social).

## Mapa do que está VIVO

Verificado por grafo de importações a partir de `app/`. Se um arquivo não está
aqui, ninguém o usa.

```
app/layout.tsx      → GrainOverlay, BarraNav, Rodape
app/page.tsx        → StarField, SmoothScrollProvider, HeroHelix,
                      FeedNoticias → NoticiaImersiva → PainelComentarios, Icones
                      BarraProgresso, FundoAurora, RadarTendencias
app/login/page.tsx  → FormularioAuth
app/api/robo/route.ts → lib/robo-noticias.ts   (o agregador — peça central)
middleware.ts       → lib/supabase/middleware.ts
```

**`public/rocket-frames/`** (123 WebP, 3,5 MB) — usado por `HeroHelix`. Não apagar.

**`lib/em-alta.ts`** — coletor do Google Notícias (ciência/tech) com filtro de
curadoria. Escrito e testado, **não ligado a nenhuma página**. Serve para
alimentar o `RadarTendencias` com assuntos mais específicos quando quisermos.

## Convenções

- **Tudo em português**: nomes de variáveis, funções, componentes e comentários.
- **Comentários explicam o PORQUÊ**, não o quê. A Rosa está aprendendo a
  programar — o código é material de estudo dela. Termos técnicos ganham
  explicação entre parênteses na primeira aparição.
- **Blindagem obrigatória**: toda leitura do Supabase vai dentro de `try/catch`
  com fallback para `content/noticias.ts`. O site **não pode** dar erro 500 se
  o banco cair. Ver o padrão em `app/page.tsx`.
- `export const dynamic = "force-dynamic"` no layout — o site é todo dinâmico
  (checa login e personaliza feed). Não tentar gerar estático.
- Commits em português: `tipo: o que foi feito` (feat, fix, docs, style, refactor).

## Armadilhas conhecidas

**OneDrive × Next.js — RESOLVIDO em 2026-07-23 movendo o projeto para fora do
OneDrive.** Local canônico agora: `C:\Users\rosam\projetos\noticias-da-ciencia`.
Sempre trabalhar aqui. A cópia antiga em
`OneDrive\Documentos\Rosa Maria - Criação de Conteúdo\noticias-da-ciencia` é só
backup — não editar (diverge do canônico).

Histórico do diagnóstico (para não repetir): o OneDrive convertia os arquivos
de build em atalhos de nuvem (`ReparsePoint = True`), e o Next falhava com
`EINVAL: readlink` do segundo build em diante. **Cinco** tentativas de consertar
mantendo o projeto no OneDrive falharam — `distDir` externo e junctions quebram
a resolução de módulos do Node (jsx-runtime não encontrado, ou duas cópias de
React → `useContext` null). A única solução real é o projeto viver fora do
OneDrive, feito. Não tentar remendar de novo.

**Lenis × scroll-snap.** O `SmoothScrollProvider` (Lenis) briga com scroll-snap
nativo. Os dois não convivem — escolher um.

**GSAP pin × React.** `ScrollTrigger` com `pin: true` cria um `pin-spacer` fora
do React. Sempre envolver em `gsap.context()` e chamar `ctx.revert()` na
limpeza, senão estoura `Failed to execute 'removeChild' on 'Node'` ao trocar de
página. Ver `HeroHelix.tsx`.

**Google Tradutor.** Desativado via `<meta name="google" content="notranslate">`
— tradutor automático troca nós do DOM e quebra o React.

## Segurança

- Nunca commitar `.env`, chaves ou tokens.
- `.gitignore` deve conter: `.env`, `.venv/`, `node_modules/`, `.next/`,
  `.next-local/`, `*.mp4`.
- Nunca `git push --force`.

## Pendências reais (não são bugs de estilo)

1. **Números falsos no feed.** `NoticiaImersiva.tsx` gera curtidas e
   "N explorando agora" por fórmula (`curtidasIniciais`, `exploradoresAgora`).
   O site está no ar com domínio próprio exibindo isso como prova social real.
   As tabelas `interacoes` e `comentarios` já existem no Supabase — trocar pelo
   número verdadeiro ou não exibir contador até haver volume.
2. **Newsletter (Fase 5 do roadmap)** — não existe tabela de lista de espera.
3. **Chave do Pexels** precisa ser rotacionada (a antiga vazou em chat).

## Como trabalhar aqui

Uma etapa por sessão, com entrega visível. Explicar o QUE e o PORQUÊ antes de
fazer. Rodar `npm run build` antes de dizer que algo está pronto — e mostrar a
saída, não afirmar sem evidência.
