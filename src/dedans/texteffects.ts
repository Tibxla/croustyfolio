// Effets de texte « terminal » du dedans — vanilla TS, même esprit que les autres
// modules (zéro dépendance, rAF, fallback calm explicite). Ils RIMENT avec l'intro :
// le decrypt rejoue le scramble du nom, l'aberration vit dans le CSS (--chroma-*).
//
//  - scramble  : un texte se « déchiffre » — glyphes aléatoires qui se figent de
//                gauche à droite jusqu'au texte final.
//  - typeLine  : machine à écrire (prompt shell) ; renvoie une Promise pour chaîner.
//
// reduced-motion : chaque fonction pose directement le texte final et sort — donc
// même appelées en mode calm, elles ne cassent rien.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#@%&$=+*·';

const prefersReduced = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pick = (): string => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '#';

export interface ScrambleOptions {
  /** Durée totale du déchiffrage (ms). */
  duration?: number;
  /** Délai avant de démarrer (ms). */
  delay?: number;
}

// Déchiffre `finalText` dans `el`. Renvoie une fonction d'annulation.
export function scramble(el: HTMLElement, finalText: string, opts: ScrambleOptions = {}): () => void {
  if (prefersReduced()) {
    el.textContent = finalText;
    return () => {};
  }
  const duration = opts.duration ?? 900;
  const chars = [...finalText];
  let raf = 0;
  let start = 0;
  let cancelled = false;

  const tick = (now: number): void => {
    if (cancelled) return;
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    const locked = Math.floor(p * chars.length);
    el.textContent = chars.map((c, i) => (c === ' ' || i < locked ? c : pick())).join('');
    if (p < 1) raf = requestAnimationFrame(tick);
    else el.textContent = finalText;
  };

  const begin = (): void => {
    if (!cancelled) raf = requestAnimationFrame(tick);
  };
  if (opts.delay) window.setTimeout(begin, opts.delay);
  else begin();

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

export interface TypeOptions {
  /** Millisecondes par caractère. */
  speed?: number;
  /** Délai avant de démarrer (ms). */
  delay?: number;
}

// Tape `text` caractère par caractère dans `el`. Résout quand c'est fini (pour
// enchaîner, ex. taper « > whoami » puis déchiffrer la réponse).
export function typeLine(el: HTMLElement, text: string, opts: TypeOptions = {}): Promise<void> {
  if (prefersReduced()) {
    el.textContent = text;
    return Promise.resolve();
  }
  const speed = opts.speed ?? 42;
  el.textContent = '';
  return new Promise((resolve) => {
    let i = 0;
    const step = (): void => {
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        resolve();
        return;
      }
      i += 1;
      window.setTimeout(step, speed);
    };
    window.setTimeout(step, opts.delay ?? 0);
  });
}
