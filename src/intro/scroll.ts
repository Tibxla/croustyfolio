import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Scrub } from './scrub';
import { FRAME_COUNT } from './frames';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollControl {
  refresh(): void;
  destroy(): void;
}

// Distance de scroll consacrée au scrub (en multiples de la hauteur d'écran).
// Plus c'est grand, plus le scrub est lent et fluide.
const SCRUB_DISTANCE = '350%';

// Câble Lenis (smooth scroll) à GSAP ScrollTrigger, épingle la scène plein
// écran de l'Intro, et mappe la progression du scroll sur l'index de frame.
export function initScrollScrub(opts: {
  trigger: HTMLElement;            // section qui déclenche et borne le pin
  stage: HTMLElement;              // élément plein écran épinglé (contient le canvas)
  scrub: Scrub;
  onProgress?: (p: number) => void; // p ∈ [0,1] — pilote le scrub et la sortie du texte
}): ScrollControl {
  const { trigger, stage, scrub, onProgress } = opts;

  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number): void => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

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
    refresh: () => ScrollTrigger.refresh(),
    destroy: () => {
      st.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
