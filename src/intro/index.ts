import { preloadFrames } from './preload';
import { Scrub } from './scrub';
import { initPageScroll, initScrollScrub, type ScrubControl } from './scroll';
import { FlowText } from './flowtext';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCoarsePointer = (): boolean => window.matchMedia('(pointer: coarse)').matches;

// Orchestrateur de l'Intro : scrub du bureau (on entre dans l'écran) + couche
// texte WebGL (nom/rôle : entrée = sortie inversée (blow-out chromatique qui se
// reconstitue), flowmap/aberration au survol, blow-out à la sortie). Ce qu'il y
// a « dans l'écran » après le noir reste à définir.
//
// Phase chargement = scroll verrouillé (Lenis stoppé) ; le bouton « passer
// l'intro » est disponible dès l'arrivée et pendant tout le scrub. Skip = aller
// simple : fondu au noir, on retire l'Intro et on allume le dedans (réutilise le
// power-on). Cf. CONTEXT.md (« Passer l'intro »).
export async function initIntro(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-intro]');
  const stage = root?.querySelector<HTMLElement>('[data-intro-stage]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-intro-canvas]');
  const loader = root?.querySelector<HTMLElement>('[data-intro-loader]');
  const bar = root?.querySelector<HTMLElement>('[data-intro-progress]');
  const cue = root?.querySelector<HTMLElement>('[data-intro-cue]');
  const skipBtn = root?.querySelector<HTMLButtonElement>('[data-intro-skip]');
  if (!root || !stage || !canvas) return;

  // Chemin léger : mobile/tactile + reduced-motion sautent le scrub lourd. Pas
  // de chargement bloquant ni de bouton « passer l'intro » ici : il n'y a pas
  // d'intro à passer, on atterrit direct dans le dedans.
  // TODO(tranche 4) : « bureau statique → transition rapide » au lieu du skip.
  if (prefersReducedMotion() || isCoarsePointer()) {
    document.documentElement.dataset.introMode = 'light';
    root.remove();
    return;
  }
  document.documentElement.dataset.introMode = 'scrub';

  // On rejoue l'Intro à CHAQUE chargement (cf. CONTEXT.md « Passer l'intro » :
  // aucune persistance). La restauration de scroll est coupée TÔT, en inline dans
  // le <head> d'index.astro (avant toute restauration navigateur) — sinon au
  // refresh on restait parfois coincé en bas sans repasser par le loader. Ici on
  // ne fait que (re)caler en haut une fois le module exécuté.
  window.scrollTo(0, 0);

  // Lenis créé tout de suite, puis STOPPÉ → scroll verrouillé pendant le
  // chargement (overflow:hidden via la classe lenis-stopped, clavier compris).
  const lenis = initPageScroll();
  lenis.stop();

  let skipped = false;
  let scrubControl: ScrubControl | null = null;
  let flow: FlowText | null = null;
  let onResize: (() => void) | null = null;

  // « Passer l'intro » : franchit le seuil d'un coup. Robuste si actionné AVANT
  // la fin du preload (rien d'autre n'est encore monté) — le flag `skipped`
  // court-circuite la suite de l'init.
  const skip = (): void => {
    if (skipped) return;
    skipped = true;

    // Fondu au noir : masque le saut (bureau/loader → dedans noir) le temps de
    // rallumer l'écran « dedans ».
    const cover = document.createElement('div');
    cover.className = 'intro__cover';
    document.body.appendChild(cover);
    requestAnimationFrame(() => cover.setAttribute('data-on', ''));

    window.setTimeout(() => {
      scrubControl?.kill();
      // Libère le contexte WebGL de FlowText + retire le listener resize qui
      // retenait le Scrub (et ses 244 frames, ~8,1 Mo) : l'intro skippée ne
      // laisse plus ni contexte fantôme ni bitmaps en mémoire.
      flow?.destroy();
      if (onResize) window.removeEventListener('resize', onResize);
      // Le dedans est remonté de -100svh pour chevaucher la fin du pin (CSS
      // scrub). L'Intro retirée, il n'a plus rien à chevaucher → on annule la
      // marge (cf. dedans.css [data-intro-skipped]) pour qu'il revienne en haut.
      document.documentElement.dataset.introSkipped = '';
      root.remove();
      window.dispatchEvent(new CustomEvent('intro:out')); // allume le dedans + retire le bouton
      lenis.start(); // au cas où on a skippé pendant le chargement (Lenis encore stoppé)
      lenis.scrollTo(0, { immediate: true });

      // Focus renvoyé dans le dedans : la nav clavier continue dans le contenu,
      // pas dans le vide laissé par l'Intro retirée.
      const dedans = document.querySelector<HTMLElement>('[data-dedans]');
      if (dedans) {
        dedans.setAttribute('tabindex', '-1');
        dedans.focus({ preventScroll: true });
      }

      // On dissout le noir → le dedans, déjà allumé, apparaît.
      cover.removeAttribute('data-on');
      window.setTimeout(() => cover.remove(), 400);
    }, 220);
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') skip();
  };

  // Le bouton est présent sur toute la phase « dehors ». Il s'efface à l'entrée
  // dans le dedans (intro:out) et revient si on remonte dans le scrub (intro:in).
  // Le skip, lui, retire l'Intro → plus de retour (aller simple).
  const showSkip = (): void => {
    skipBtn?.setAttribute('data-ready', '');
    window.addEventListener('keydown', onKey);
  };
  const hideSkip = (): void => {
    skipBtn?.removeAttribute('data-ready');
    window.removeEventListener('keydown', onKey);
  };
  skipBtn?.addEventListener('click', skip);
  window.addEventListener('intro:out', hideSkip);
  window.addEventListener('intro:in', showSkip);
  showSkip();

  const images = await preloadFrames((loaded, total) => {
    bar?.style.setProperty('--p', String(loaded / total));
  });
  if (skipped) return; // skippé pendant le preload → on n'initialise pas le scrub

  try {
    await Promise.all([
      document.fonts.load('700 100px "Archivo Narrow"'),
      document.fonts.load('500 24px "Schibsted Grotesk"'),
    ]);
  } catch {
    /* fallback si le chargement échoue */
  }
  if (skipped) return;

  const scrub = new Scrub(canvas, images);
  scrub.draw(0);
  loader?.setAttribute('data-done', '');
  cue?.setAttribute('data-ready', '');
  lenis.start(); // fin du chargement → on lève le verrou : le scrub devient opérable

  const flowText = new FlowText(stage, {
    name: 'Thibaud Thomas-Lamotte',
    role: 'Développeur full-stack & IA',
  });
  flow = flowText; // exposé à skip() pour le teardown
  if (loader) stage.insertBefore(flowText.element, loader);
  flowText.start();
  flowText.playIntro(200);

  let outFired = false;
  scrubControl = initScrollScrub({
    trigger: root,
    stage,
    scrub,
    onProgress: (p) => {
      if (p > 0.02) cue?.setAttribute('data-hidden', '');
      else cue?.removeAttribute('data-hidden');
      // Sortie : blow-out chromatique du nom, TERMINÉ (opacity 0) avant que le
      // dedans ne s'allume (p≈0.93) — sinon le nom reste visible derrière
      // « Sélection » pendant la transition.
      flowText.setExit(clamp01((p - 0.77) / 0.14));
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
  onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      scrub.resize();
      flowText.resize();
    });
  };
  window.addEventListener('resize', onResize);
}
