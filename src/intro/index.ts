import { preloadFrames } from './preload';
import { Scrub } from './scrub';
import { initScrollScrub } from './scroll';
import { FlowText } from './flowtext';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCoarsePointer = (): boolean => window.matchMedia('(pointer: coarse)').matches;

// Orchestrateur de l'Intro : scrub du bureau (on entre dans l'écran) + couche
// texte WebGL (nom/rôle : entrée = sortie inversée (blow-out chromatique qui se
// reconstitue), flowmap/aberration au survol, blow-out à la sortie). Ce qu'il y
// a « dans l'écran » après le noir reste à définir.
export async function initIntro(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-intro]');
  const stage = root?.querySelector<HTMLElement>('[data-intro-stage]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-intro-canvas]');
  const loader = root?.querySelector<HTMLElement>('[data-intro-loader]');
  const bar = root?.querySelector<HTMLElement>('[data-intro-progress]');
  const cue = root?.querySelector<HTMLElement>('[data-intro-cue]');
  if (!root || !stage || !canvas) return;

  // Chemin léger : mobile/tactile + reduced-motion sautent le scrub lourd.
  // TODO(tranche 4) : « bureau statique → transition rapide » au lieu du skip.
  if (prefersReducedMotion() || isCoarsePointer()) {
    document.documentElement.dataset.introMode = 'light';
    root.remove();
    return;
  }
  document.documentElement.dataset.introMode = 'scrub';

  const images = await preloadFrames((loaded, total) => {
    bar?.style.setProperty('--p', String(loaded / total));
  });

  try {
    await Promise.all([
      document.fonts.load('700 100px "Archivo Narrow"'),
      document.fonts.load('500 24px "Schibsted Grotesk"'),
    ]);
  } catch {
    /* fallback si le chargement échoue */
  }

  const scrub = new Scrub(canvas, images);
  scrub.draw(0);
  loader?.setAttribute('data-done', '');
  cue?.setAttribute('data-ready', '');

  const flow = new FlowText(stage, {
    name: 'Thibaud Thomas-Lamotte',
    role: 'Développeur full-stack & IA',
  });
  if (loader) stage.insertBefore(flow.element, loader);
  flow.start();
  flow.playIntro(200);

  let outFired = false;
  initScrollScrub({
    trigger: root,
    stage,
    scrub,
    onProgress: (p) => {
      if (p > 0.02) cue?.setAttribute('data-hidden', '');
      else cue?.removeAttribute('data-hidden');
      // Sortie : blow-out chromatique du nom, TERMINÉ (opacity 0) avant que le
      // dedans ne s'allume (p≈0.93) — sinon le nom reste visible derrière
      // « Sélection » pendant la transition.
      flow.setExit(clamp01((p - 0.77) / 0.14));
      // Fin de l'intro : on dissout l'écran (le stage) sur les derniers %, pour
      // révéler le monde sombre qui « s'allume » derrière — au lieu d'un noir à
      // scroller. `intro:out` allume le dedans, `intro:in` l'éteint quand on
      // remonte → l'allumage se rejoue à chaque passage. Hystérésis [0.9, 0.93]
      // pour éviter le clignotement au seuil.
      stage.style.opacity = String(1 - clamp01((p - 0.93) / 0.07));
      if (!outFired && p >= 0.93) {
        outFired = true;
        window.dispatchEvent(new CustomEvent('intro:out'));
      } else if (outFired && p < 0.9) {
        outFired = false;
        window.dispatchEvent(new CustomEvent('intro:in'));
      }
    },
  });

  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      scrub.resize();
      flow.resize();
    });
  });
}
