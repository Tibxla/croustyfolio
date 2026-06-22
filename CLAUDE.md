# croustyfolio

Portfolio perso (Thibaud / Tibxla). **Astro + TypeScript vanilla** — aucune
intégration de framework UI. Libs : OGL, GSAP, Lenis.
Code : `src/intro/` (l'Intro : scrub bureau→écran + nom WebGL) ·
`src/dedans/` (le monde sombre « software »). Voir `CONTEXT.md` pour le langage.

## Commandes

```bash
npm run dev      # serveur de dev (astro, port 4321)
npx astro check  # typecheck — à lancer avant de committer
npm run build    # build statique
```

## Déploiement

Prod sur **Vercel** → **https://thibaudtl.xyz** (projet `croustyfolio`, team `tibxlas-projects` ; le compte perso n'est pas scopable en CLI).
Repo GitHub connecté ; **branche de prod = `main`** (push `dev` = preview ; pour publier en prod : merge `dev`→`main`).
Framework épinglé Astro via `vercel.json` (sortie `dist/`). Redéploy manuel : `vercel --prod --scope tibxlas-projects`.

## Convention : pas de React

On ne dépend d'aucun framework UI. Les composants React Bits (fonds, curseurs…)
sont **portés à la main en vanilla TS** (`curl https://reactbits.dev/r/{Name}.json`).
`components.json` + `.mcp.json` ne servent qu'à **lire la source**, pas à builder.

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
