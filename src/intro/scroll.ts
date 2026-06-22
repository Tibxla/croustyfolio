import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Scrub } from './scrub';
import { FRAME_COUNT } from './frames';

gsap.registerPlugin(ScrollTrigger);

// Distance de scroll consacrée au scrub (en multiples de la hauteur d'écran).
// Plus c'est grand, plus le scrub est lent et fluide.
const SCRUB_DISTANCE = '350%';

// Lenis (smooth scroll) au niveau de la PAGE. Créé une fois, il vit toute la
// durée de la page : l'Intro ET le dedans s'appuient dessus (le dedans lit le
// scroll natif, mais profite du lissage). Le scrub de l'Intro ne fait que s'y
// brancher ; le tuer (skip) n'affecte donc pas le scroll du dedans.
// `stop()`/`start()` posent/lèvent la classe `lenis-stopped` (→ overflow:hidden,
// cf. global.css) : c'est le verrou du scroll pendant le chargement, qui bloque
// aussi le scroll clavier.
export function initPageScroll(): Lenis {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export interface ScrubControl {
  kill(): void;
}

// Épingle la scène plein écran de l'Intro et mappe la progression du scroll sur
// l'index de frame. S'appuie sur le Lenis de page (cf. initPageScroll) sans le
// posséder : `kill()` ne défait que le pin/scrub, pas le smooth scroll.
export function initScrollScrub(opts: {
  trigger: HTMLElement;            // section qui déclenche et borne le pin
  stage: HTMLElement;              // élément plein écran épinglé (contient le canvas)
  scrub: Scrub;
  onProgress?: (p: number) => void; // p ∈ [0,1] — pilote le scrub et la sortie du texte
}): ScrubControl {
  const { trigger, stage, scrub, onProgress } = opts;

  const st = ScrollTrigger.create({
    trigger,
    start: 'top top',
    end: `+=${SCRUB_DISTANCE}`,
    pin: stage,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrub.draw(self.progress * (FRAME_COUNT - 1));
      onProgress?.(self.progress);
    },
  });

  return {
    kill: () => st.kill(),
  };
}
