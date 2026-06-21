# Product

## Register

brand

## Users

Deux publics qui découvrent Thibaud (développeur web, junior) via un lien :
- **Clients freelance** — peu techniques, jugent à la vibe et au craft (« est-ce qu'il va me faire briller ? »).
- **Recruteurs** — pressés, blasés (ils enchaînent les portfolios), réflexe « skip » au moindre ennui.

Le job à faire dans les premières secondes : leur donner envie de bosser avec lui. La décision réelle se prend plus tard, sur les projets.

## Product Purpose

Portfolio personnel de Thibaud (handle Tibxla). L'**intro** (bureau blanc scrubé au scroll → on entre dans l'écran → portfolio sombre) ne convertit pas : elle **pose le ton** (sobre, pro, soigné) et passe la main. La conversion se fait sur les projets, après. Succès = un visiteur qui pense « ce mec maîtrise » et continue à scroller.

## Brand Personality

Posé, précis, confiant. Premium par le **craft de la retenue** — la matière et la précision, pas la décoration. Émotions visées : confiance, calme, maîtrise. Le visiteur **opère** l'expérience (le scroll est son bouton), il ne la subit pas.

## Anti-references

- Le portfolio dev **générique** : le template bureau-blanc-qui-zoome vu partout, sans intention.
- Le **festival d'animations** : glitch, scramble, typewriter, texte qui rebondit. Ça crie « junior qui montre tous ses plugins ».
- Les **aplats plats** qui font « cheap ».
- L'**editorial-magazine** par réflexe (serif italique + drop caps + grille broadsheet) — hors-sujet ici.

## Design Principles

1. **Le craft de la retenue.** Premium par la matière (scrub beurré, blend, boot) et la précision, jamais par un effet en plus.
2. **Montrer, pas vendre.** Le travail vend ; l'intro pose le ton et ne se transforme pas en argumentaire.
3. **Le visiteur opère, il ne subit pas.** Rien ne bouge tant qu'il ne scrolle pas.
4. **L'effet vient de la matière**, pas d'animations plaquées (le scrub, le `mix-blend-mode: difference`, le boot PS3, la Vague).
5. **Desktop-first immersif, dégradé gracieux.** Mobile et reduced-motion reçoivent une version calme, pas au rabais.

## Accessibility & Inclusion

- `prefers-reduced-motion` → chemin léger sans long scrub (déjà acté, ADR-0004).
- Audio (swell du boot) muet possible, jamais imposé ; le visuel ne dépend jamais du son.
- Surveiller le contraste du texte en `difference` selon le fond.
