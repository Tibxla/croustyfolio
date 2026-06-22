import { Cursor } from './cursor';
import { Gallery } from './gallery';
import { PointerFX } from './pointerfx';
import { DotField } from './dotfield';
import { LineWaves } from './linewaves';
import { initReveals } from './reveals';
import { scramble, typeLine } from './texteffects';
import { animateCounters } from './counters';
import { Marquee } from './marquee';
import { FlowText } from '../intro/flowtext';

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

  // Clic sur l'email / le numéro = copie dans le presse-papier (+ retour visuel).
  // Hors du mode scrub → marche aussi sur mobile.
  const copyFeedback = root.querySelector<HTMLElement>('[data-dc-copy-feedback]');
  let copyTimer = 0;
  root.querySelectorAll<HTMLElement>('[data-dc-copy]').forEach((el) => {
    el.addEventListener('click', () => {
      const val = el.dataset.dcCopy ?? '';
      if (!val || !navigator.clipboard) return;
      void navigator.clipboard.writeText(val).then(() => {
        if (!copyFeedback) return;
        copyFeedback.textContent = `✓ ${val} copié`;
        window.clearTimeout(copyTimer);
        copyTimer = window.setTimeout(() => {
          copyFeedback.textContent = '';
        }, 2200);
      });
    });
  });

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

  // Marquee de la zone Stack (vitesse couplée au scroll) + compteurs des fiches.
  const marqueeEl = root.querySelector<HTMLElement>('[data-dc-marquee]');
  const marquee = marqueeEl ? new Marquee(marqueeEl) : null;
  animateCounters(root);

  // Séquence d'accueil : « > whoami » se tape, puis le rôle se déchiffre. Jouée
  // une seule fois, à l'allumage de l'écran (power-on).
  const typeEl = root.querySelector<HTMLElement>('[data-dc-type]');
  const roleEl = root.querySelector<HTMLElement>('[data-dc-scramble]');
  const roleFinal = roleEl?.textContent ?? '';
  const headlineEl = root.querySelector<HTMLElement>('[data-dc-headline]');
  const headlineFinal = headlineEl?.textContent ?? '';
  let whoamiPlayed = false;
  const playWhoami = (): void => {
    if (whoamiPlayed) return;
    whoamiPlayed = true;
    if (headlineEl) scramble(headlineEl, headlineFinal, { duration: 1100, delay: 700 });
    if (typeEl) {
      void typeLine(typeEl, 'whoami', { speed: 70, delay: 250 }).then(() => {
        if (roleEl) scramble(roleEl, roleFinal, { duration: 900, delay: 120 });
      });
    } else if (roleEl) {
      scramble(roleEl, roleFinal, { duration: 900 });
    }
  };

  // Contact : le numéro rendu avec le MÊME flowmap WebGL que l'intro — entrée
  // blow-out à la révélation, distorsion + aberration chromatique au survol.
  const contactStage = root.querySelector<HTMLElement>('[data-dc-contact-stage]');
  if (contactStage) {
    // reduce:true → pas d'écoute pointeur globale d'emblée. L'IO ci-dessous
    // n'alimente le flowmap (rendu WebGL + readback canvas à chaque mousemove)
    // QUE quand la zone contact est à l'écran ; tout en bas de la page, elle ne
    // tourne donc pas en fond. L'effet de survol reste intact une fois visible.
    const contactFlow = new FlowText(contactStage, {
      name: 'contact@thibaudtl.xyz',
      role: '',
      nameScale: 0.4,
      upper: false,
      reduce: true,
    });
    contactFlow.start();
    let contactIntroPlayed = false;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        contactFlow.setListening(visible);
        if (visible && !contactIntroPlayed) {
          contactIntroPlayed = true;
          contactFlow.playIntro(600);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(contactStage);
  }

  // Timeline du Parcours : la ligne se remplit et le point lumineux descend selon
  // la progression du scroll dans la section (piloté par la boucle → fluide).
  const careerSection = root.querySelector<HTMLElement>('.dc-career');
  const careerFill = root.querySelector<HTMLElement>('[data-dc-timeline]');
  const careerDot = root.querySelector<HTMLElement>('[data-dc-timeline-dot]');
  const updateCareer = (): void => {
    if (!careerSection || !careerFill) return;
    const r = careerSection.getBoundingClientRect();
    // Le dénominateur = distance de scroll sur laquelle le point descend de haut
    // en bas ; plus il est grand, plus la descente est lente (1.2 = calée au scroll).
    const p = Math.max(0, Math.min(1, (window.innerHeight * 0.82 - r.top) / (r.height * 1.2)));
    careerFill.style.transform = `scaleY(${p.toFixed(3)})`;
    if (careerDot) careerDot.style.top = `${(p * 100).toFixed(2)}%`;
  };

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
    marquee?.tick();
    updateCareer();
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
  // écran d'entrée révélés simultanément + flash + barre + curseur + boucle.
  //
  // Piloté par le CYCLE DE VIE de l'Intro (`intro:out` au franchissement du
  // seuil, `intro:in` en remontant — le skip émet aussi `intro:out`), PAS par une
  // IntersectionObserver de visibilité : le dedans est remonté de -100svh, donc
  // tant que le pin de l'Intro n'existe pas (pendant le chargement), il chevauche
  // le haut du document → une IO le croit « à l'écran » et l'allume en plein
  // chargement (flash consommé d'avance, barre + curseur visibles sur le bureau).
  // `intro:out/in` bornent exactement la visibilité du dedans, sans ce faux
  // positif. On repart toujours du haut au chargement (cf. intro/index.ts), donc
  // pas besoin de filet « page déjà scrollée ».
  let lit = false;
  const setLit = (on: boolean): void => {
    if (on === lit) return;
    lit = on;
    if (on) {
      root.dataset.dcActive = ''; // barre + progression
      root.dataset.dcPower = ''; // (ré)enclenche le flash + l'apparition d'un coup
      startBg();
      cursor?.enable();
      start();
      playWhoami();
    } else {
      delete root.dataset.dcActive;
      delete root.dataset.dcPower; // éteint → flash rejouable au prochain passage
      stopBg();
      cursor?.disable();
      stop();
    }
  };
  window.addEventListener('intro:out', () => setLit(true));
  window.addEventListener('intro:in', () => setLit(false));

  // Recalages : police chargée → largeur de la track juste ; resize → tout.
  document.fonts.ready
    .then(() => {
      gallery.layout();
      marquee?.measure();
    })
    .catch(() => {});
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      gallery.layout();
      marquee?.measure();
    });
  });
}
