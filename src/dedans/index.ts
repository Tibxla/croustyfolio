import { Cursor } from './cursor';
import { Gallery } from './gallery';
import { PointerFX } from './pointerfx';
import { DotField } from './dotfield';
import { LineWaves } from './linewaves';
import { initReveals } from './reveals';

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCoarsePointer = (): boolean => window.matchMedia('(pointer: coarse)').matches;

// Horloge système vivante (barre du haut + colophon). Pur affichage, pas du
// mouvement : on la garde même en reduced-motion.
function startClock(root: HTMLElement): () => void {
  const els = root.querySelectorAll<HTMLElement>('[data-dc-clock]');
  const tick = (): void => {
    const t = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    els.forEach((el) => (el.textContent = t));
  };
  tick();
  const id = window.setInterval(tick, 15000);
  return () => window.clearInterval(id);
}

// Monde « dedans » : ce qu'il y a après l'Intro. Fond « dot field » (grille de
// points qui se bombe au curseur), barre système, galerie scrubée des projets,
// à-propos, contact. Desktop (pointeur fin, motion ok) = expérience scrubée
// immersive ; mobile / reduced-motion = version calme (liste verticale, fond
// figé, pas de curseur).
export function initDedans(): void {
  const root = document.querySelector<HTMLElement>('[data-dedans]');
  if (!root) return;

  const calm = prefersReducedMotion() || isCoarsePointer();

  startClock(root);

  // Fond du monde sombre (portés de React Bits, vanilla). LineWaves construit en
  // PREMIER → son canvas est derrière ; le dot field se dessine PAR-DESSUS.
  const bgEl = root.querySelector<HTMLElement>('[data-dc-bg]');
  const waves = bgEl ? new LineWaves(bgEl, { brightness: 0.05 }) : null;
  const dots = bgEl ? new DotField(bgEl) : null;
  const startBg = (): void => {
    waves?.start();
    dots?.start();
  };
  const stopBg = (): void => {
    waves?.stop();
    dots?.stop();
  };

  // Galerie : horizontale scrubée seulement hors mode calm.
  if (!calm) document.documentElement.dataset.dcMode = 'scrub';
  const gallery = new Gallery(root, !calm);

  // ---- Mode calm : fonds figés, liste verticale, contenu visible. ----
  if (calm) {
    waves?.renderStatic();
    dots?.renderStatic();
    return;
  }

  // ---- Mode scrub : expérience complète. ----
  initReveals(root);

  // Curseur natif conservé + petit caret terminal qui le suit.
  const cursor = new Cursor(root);
  const fx = new PointerFX(root);

  // Pointeur partagé pour le curseur custom (le dot field écoute la souris seul).
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  let raf = 0;
  let running = false;
  const frame = (): void => {
    cursor?.update(mx, my);
    gallery.tick();
    fx.tick();
    raf = requestAnimationFrame(frame);
  };
  const start = (): void => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };
  const stop = (): void => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Allumage de l'écran : à la fin de l'Intro (le nom blow-out et l'écran de
  // l'intro se dissout), le monde sombre « s'allume » d'un coup — dot field +
  // écran d'entrée révélés simultanément + flash. Déclenché par l'event
  // `intro:out`. Filet de sécurité : aussi à l'activation (page déjà scrollée).
  let lit = false;
  const powerOn = (): void => {
    if (lit) return;
    lit = true;
    startBg();
    root.dataset.dcPower = ''; // (ré)enclenche le flash + l'apparition d'un coup
  };
  const powerOff = (): void => {
    if (!lit) return;
    lit = false;
    stopBg();
    delete root.dataset.dcPower; // éteint → rejouable au prochain passage
  };
  window.addEventListener('intro:out', powerOn);
  window.addEventListener('intro:in', powerOff);

  // La boucle (curseur custom + chrome) ne tourne que quand le monde dedans est
  // à l'écran — pas pendant l'Intro qui le précède.
  const activate = (on: boolean): void => {
    if (on) {
      root.dataset.dcActive = '';
      powerOn();
      cursor?.enable();
      start();
    } else {
      delete root.dataset.dcActive;
      cursor?.disable();
      stop();
    }
  };
  // rootMargin négatif en bas serré : comme le dedans est remonté pour chevaucher
  // la fin de l'intro, on n'active (curseur, boucle, chrome) que quand l'écran
  // d'entrée est quasi cadré (≈ allumage), pas pendant le bureau de l'intro.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => activate(e.isIntersecting)),
    { rootMargin: '0px 0px -75% 0px', threshold: 0 },
  );
  io.observe(root);

  // Recalages : police chargée → largeur de la track juste ; resize → tout.
  document.fonts.ready.then(() => gallery.layout()).catch(() => {});
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      gallery.layout();
    });
  });
}
