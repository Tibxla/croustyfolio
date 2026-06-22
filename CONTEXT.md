# CroustyFolio

Portfolio personnel de Thibaud (handle Tibxla). Ce document est le glossaire du langage du projet — un dictionnaire, pas une spec. Il ne contient aucun détail d'implémentation.

## Langage

**Intro** :
La séquence d'ouverture du site : on part d'un bureau blanc, on entre dans l'écran, et on arrive dans le portfolio. Son seul rôle est de poser le ton, pas de convertir.
_Éviter_ : splash, landing, hero

**Scrub** :
Le pilotage de l'intro par le scroll — la progression du scroll fait avancer l'image. Rien ne joue tout seul ; le visiteur opère l'intro comme un appareil.
_Éviter_ : lecture auto, animation, vidéo qui tourne

**Les deux mondes** :
La distinction structurante du portfolio : *dehors* = blanc (le bureau, vu comme le hardware) ; *dedans* = sombre (le portfolio, vu comme le software).
_Éviter_ : clair/foncé, dark mode, thème

**Le seuil** :
Le cadre du moniteur — la frontière entre les deux mondes, qu'on franchit pendant l'Intro.
_Éviter_ : bordure, cadre, transition

**Le chargement** :
La phase d'attente avant que l'Intro soit jouable (le temps que l'appareil tienne tout en main). Vécue *dans le dehors*, comme un appareil qui s'éveille : honnête sur son avancement et discrètement vivant, jamais un sablier posé pour meubler. Parle la voix du dehors, pas celle du dedans.
_Éviter_ : loader, spinner, splash, page de loading, écran de démarrage

**Passer l'intro** :
Le contrôle discret qui franchit le seuil d'un coup, depuis le chargement comme depuis le scrub, pour entrer directement dans le dedans. Un aller simple : une fois passé, on ne retrouve plus l'intro sans recharger.
_Éviter_ : skip, bypass, entrer

**Sélection** :
La zone du dedans qui présente les projets : un petit nombre de projets phares, curatés, parcourus en scrubant. Le portfolio ne déballe pas un catalogue, il *sélectionne*.
_Éviter_ : portfolio, galerie, projets, grille, carrousel

**Fiche système** :
La forme sous laquelle un projet apparaît dans la Sélection : sa donnée réelle (rôle, stack, métriques, statut prod) traitée comme le visuel principal — un relevé du software en marche, pas une carte marketing. Un vrai screenshot peut venir en appui, encadré comme un écran, jamais en pièce maîtresse.
_Éviter_ : carte projet, vignette, case, carte marketing

**Étude de cas** :
L'écran de profondeur d'un projet, atteint depuis sa fiche système : on descend d'un cran dans le « système » pour lire le récit (problème, contraintes, décisions, résultat). Réservée à Edifig — le seul projet sans preuve cliquable. URL partageable.
_Éviter_ : page projet, détail, sous-page, article
