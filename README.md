# CroustyFolio

Portfolio personnel de **Thibaud Thomas-Lamotte** (Tibxla), développeur full-stack & IA.
En ligne : [thibaudtl.com](https://thibaudtl.com)

Le site se parcourt en **deux mondes**. On part d'un bureau blanc (le *hardware*) qu'on scrube au scroll pour entrer dans l'écran, et on arrive dans le **dedans** : un monde sombre « software » où vivent les projets.

## Stack

- **[Astro](https://astro.build)** + **TypeScript** strict, vanilla (aucune intégration de framework UI)
- **[OGL](https://github.com/oframe/ogl)** : effets WebGL (le nom de l'intro en flowmap + aberration chromatique, le fond)
- **[GSAP](https://gsap.com)** + **[Lenis](https://lenis.studio)** : scroll piloté et scrub
- Typographies self-hosted via Fontsource : Archivo Narrow, Schibsted Grotesk, IBM Plex Mono

Pas de React : les composants empruntés à [React Bits](https://reactbits.dev) sont **portés à la main en vanilla TS**.

## Structure

```
src/
├── intro/      l'Intro : scrub bureau → écran + nom rendu en WebGL (flowmap)
├── dedans/     le monde sombre : accueil, Sélection, Parcours, Stack, à-propos, contact
├── pages/      index.astro (intro + dedans) · edifig.astro (étude de cas)
└── styles/     global.css · dedans.css
```

Le **dedans** se lit en un seul scroll, par zones : `> whoami` → **Sélection** des projets (liste qui réagit au survol, preview en parallaxe) → **Parcours** → **Stack** → à-propos → contact. Sur mobile et en `prefers-reduced-motion`, tout retombe en mode calme : listes verticales, animations coupées, lisible sans JS.

## Commandes

```bash
npm install
npm run dev      # serveur de dev (port 4321)
npx astro check  # typecheck (à lancer avant de committer)
npm run build    # build statique
```

## Documentation

- [`CONTEXT.md`](CONTEXT.md) : le glossaire du langage du projet (un dictionnaire, pas une spec)
- [`docs/adr/`](docs/adr) : les décisions d'architecture tracées (ADR)

---

© 2026 Thibaud Thomas-Lamotte · `contact@thibaudtl.com`
