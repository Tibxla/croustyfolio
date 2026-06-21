# Intro CroustyFolio — spec

Issu de la session de brainstorming du 2026-06-20, mis à jour 2026-06-21.
Portée : l'intro du portfolio (jusqu'à l'entrée « dans l'écran »).

> Note : la direction initiale pour ce qu'il y a « dans l'écran » a été
> **abandonnée**. Ce document ne couvre plus que l'intro jusqu'au noir ; le
> concept de l'intérieur de l'écran est à redéfinir.

## Concept

1. **Plan large du bureau full white.** État showroom. Fond seamless blanc, double écran à dalles noires, clavier/souris/tour blancs. Sobriété + pro dès la première frame.
2. **Le visiteur scrolle → push-in scrubé sur la vidéo.** Rien ne bouge tant qu'il ne scrolle pas ; la caméra avance vers l'écran de gauche.
3. **Le nom apparaît**, posé sur la scène (voir « couche texte »).
4. **On traverse la dalle → noir total.** Frontière entre deux mondes ; le nom se réfracte et se dissout juste avant le noir.
5. **On est « dans l'écran » = le portfolio, sombre.** *(Contenu/navigation à définir.)*

## Décisions verrouillées

- **Mécanique = vidéo scrubée au scroll.** Le scroll pilote la lecture. Aucune animation automatique.
- **Deux mondes.** DEHORS = blanc (bureau, hardware, showroom). DEDANS = sombre (portfolio, software). Le cadre du moniteur est le seuil.
- **Le portfolio est sombre.** On entre sur du noir et ça reste sombre.
- **Scope.** L'intro ne convertit pas ; elle pose le ton. Pas de texte de vente.

## Couche texte (le nom)

Le nom + rôle sont rendus en **WebGL** par-dessus la scène :
- **Toujours inversé** sur le fond (`mix-blend: difference`) : sombre sur le bureau clair, clair sur les zones noires.
- **Entrée = la sortie inversée** : le nom se reconstitue depuis le blow-out chromatique (canaux R/G/B qui convergent + fondu in), miroir exact de la sortie.
- **Au survol** : flowmap (distorsion qui suit le curseur) + **aberration chromatique** + rainbow selon la vélocité.
- **À la sortie** (fin du scrub) : **blow-out chromatique** (les canaux R/G/B se séparent) puis dissolution, terminé au ras du noir.

## Insights de synthèse

1. **L'intro n'est pas regardée, elle est UTILISÉE.** Le scroll est le bouton power ; le visiteur opère un appareil. Ça désamorce le réflexe « skip intro ».
2. **La retenue EST le pitch.** Zéro texte de vente : le travail vend, le silence signe le craft.
3. **Métaphore.** Hardware blanc dehors, software sombre dedans.

## Specs techniques

Stack : Astro + TypeScript, Lenis (smooth scroll), GSAP/ScrollTrigger, OGL (couche texte WebGL).

### Scrub

- Conteneur de scroll haut **pinné** via ScrollTrigger, Lenis pour le lissage.
- Source : `portfolio_intro.mp4`, ~8 s, 2560×1440. Frames extraites en **WebP 2560px (244 frames, ~8 Mo)**, préchargées, dessinées sur un `<canvas>` selon la progression (technique « Apple AirPods »). Pas de `<video>` (seeking saccadé, throttle iOS).

### Raccord noir → portfolio

- La dernière frame est noir pur ; on bascule du canvas vers le DOM sombre (couture invisible noir → sombre).

### Robustesse / fallbacks

- `prefers-reduced-motion` + mobile/tactile : chemin léger (pas de long scrub). Voir ADR-0004.

## À définir

- **« Dans l'écran »** : le fond + la navigation une fois entré (nouvelle direction).
- **Apparition de l'identité** après l'intro.
- Chemin léger mobile (tranche 4).
