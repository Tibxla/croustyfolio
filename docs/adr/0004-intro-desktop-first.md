# Intro immersive desktop-first ; mobile et reduced-motion en chemin léger

Décision : le **Scrub** complet (canvas pinné, 244 frames, 2560px) est servi sur **desktop**. Sur **mobile/tactile** et en **`prefers-reduced-motion`**, l'Intro prend un chemin léger délibéré : bureau blanc statique → transition rapide → portfolio sombre, **sans long scrub ni tier de frames mobile**.

Pourquoi : l'immersion scrollée est un délice desktop. Sur mobile, la donnée (~8 Mo), la perf et l'agacement du scroll-jack tactile plaident pour la retenue. L'essentiel — le portfolio sombre — reste présent partout, juste introduit plus calmement. Ce n'est pas une version au rabais.

À ne pas « corriger » : l'absence de scrub sur mobile est **intentionnelle, pas un manque**.
