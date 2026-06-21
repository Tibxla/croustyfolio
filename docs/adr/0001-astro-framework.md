# Astro comme framework du portfolio

Contexte : portfolio perso composé d'une Intro immersive très côté-client et de futures pages projets où le contenu et le SEO comptent. Le dev maîtrise Next.js, qui était le défaut « sûr ».

Décision : **Astro + TypeScript**, repo neuf. Choisi pour le score perf/Lighthouse (≈0 JS sur le contenu — un signal de craft pour des recruteurs/devs/clients qui jugent justement le craft), le contenu projets en MDX natif, et la montée en compétence sur Astro.

Note clé qui dé-risque le choix : le cœur de l'Intro (scrub canvas, GSAP, WebGL) est **agnostique au framework**. Astro vs Next ne change presque rien à l'Intro elle-même ; le choix gouverne surtout la phase contenu.

## Options considérées

- **Next.js (App Router)** — familier, content + SEO solides. Écarté : la familiarité ne l'emporte pas sur le gain perf + la montée en compétence, et un Next bien fait n'égale pas tout à fait le baseline JS d'Astro.
- **Vite + React (CSR)** — léger en dev mais SEO faible (HTML initial vide), il faudrait reconstruire ce qu'Astro donne d'office. Écarté.
