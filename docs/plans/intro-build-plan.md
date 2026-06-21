# Plan de build — Intro CroustyFolio

Décisions d'implémentation. Le glossaire est dans `CONTEXT.md` ; les décisions structurantes dans `docs/adr/`.

## Décisions verrouillées

| Sujet | Décision | Réf |
|---|---|---|
| Framework | Astro + TypeScript, repo neuf | ADR-0001 |
| Îlot intro | vanilla TS (pas de framework d'UI) | — |
| Scrub | séquence de frames sur `<canvas>` (pas `<video>`) | ADR-0002 |
| Assets | WebP, 2560px, 244 frames (~8 Mo), preload + loader, commitées | ADR-0002 |
| Couche texte | nom/rôle en WebGL (`FlowText`) : **entrée = sortie inversée** (blow-out chromatique qui se reconstitue), **flowmap + aberration chromatique** au survol, **blow-out chromatique** à la sortie, **toujours inversé** (`mix-blend: difference`) | — |
| Police | self-hostée (`@fontsource` : Archivo Narrow 700, Schibsted Grotesk 500) | — |
| Fallbacks | desktop-first : mobile + reduced-motion → chemin léger | ADR-0004 |

## Architecture (timeline de scroll)

```
scroll 0% ───────────────────────── 100% ─────────► « dans l'écran » (à définir)
│ canvas pinné (fixed)                │ unpin
│ scrub frame 0 → noir total          │
│ (bureau blanc → on entre)           │
│ + couche texte : nom au repos,      │
│   blow-out chromatique en fin       │
└─────────────────────────────────────┘
```

## État

- **Fait** : scaffold, pipeline frames, scrub desktop, couche texte (FlowText) intégrée sur `/`.
- **À définir** : ce qu'il y a **« dans l'écran »** après le noir (fond + navigation). La direction initiale a été **abandonnée** — nouvelle idée à venir.

## Reste à faire

- **Dans l'écran** : concept du fond + de la navigation une fois entré (nouvelle idée).
- **Fallbacks** (tranche 4) : chemin léger mobile / reduced-motion (« bureau statique → transition rapide » au lieu du simple skip actuel).
- **Polish** : physique exacte du raccord noir → contenu, apparition de l'identité après l'intro.
