// Compteurs : les métriques numériques des fiches s'incrémentent à la révélation
// (la donnée qui prend vie = le visuel). Format français : espace fine insécable
// comme séparateur de milliers, virgule décimale. Une valeur non numérique
// (« FR · EN », « PWA », « offline-first ») reste statique.
//
// reduced-motion : aucune animation, la valeur finale reste affichée telle quelle.
// Déclenché par IntersectionObserver → marche aussi quand la fiche arrive en
// scrubant (le rect translaté entre dans le viewport).

const prefersReduced = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const THIN = ' '; // espace fine insécable

interface Parsed {
  prefix: string;
  suffix: string;
  value: number;
  decimals: number;
}

// Découpe « ~1 600 » → {prefix:'~', value:1600, decimals:0}, « 0,978 » → 3 décimales,
// « 12 000+ » → suffix '+'. Renvoie null si pas de nombre exploitable (→ statique).
function parse(raw: string): Parsed | null {
  const m = raw.match(/^(\D*?)([\d\s.,  ]*\d)(\D*)$/);
  if (!m) return null;
  const prefix = m[1] ?? '';
  const numStr = m[2] ?? '';
  const suffix = m[3] ?? '';
  const cleaned = numStr.replace(/[\s  ]/g, '').replace(',', '.');
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  const dot = cleaned.indexOf('.');
  const decimals = dot >= 0 ? cleaned.length - dot - 1 : 0;
  return { prefix, suffix, value, decimals };
}

function fmt(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  const parts = fixed.split('.');
  const intPart = (parts[0] ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  const dec = parts[1];
  return dec ? `${intPart},${dec}` : intPart;
}

function run(el: HTMLElement, parsed: Parsed, raw: string, duration: number): void {
  const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
  let start = 0;
  const step = (now: number): void => {
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    if (p < 1) {
      el.textContent = `${parsed.prefix}${fmt(parsed.value * easeOut(p), parsed.decimals)}${parsed.suffix}`;
      requestAnimationFrame(step);
    } else {
      el.textContent = raw; // valeur finale exacte (garde le format de la source)
    }
  };
  requestAnimationFrame(step);
}

// Anime un seul élément de 0 → sa valeur (réutilisable à la demande, ex. la
// preview des projets qui « recharge » ses chiffres à chaque changement).
export function countElement(el: HTMLElement, duration = 800): void {
  const raw = el.dataset.dcFinal ?? el.textContent ?? '';
  el.dataset.dcFinal = raw;
  const parsed = parse(raw);
  if (!parsed || prefersReduced()) {
    el.textContent = raw;
    return;
  }
  run(el, parsed, raw, duration);
}

// Anime tous les `[data-dc-count]` sous `root`. À appeler une fois le dedans actif.
export function animateCounters(root: HTMLElement, duration = 1100): IntersectionObserver | null {
  const els = [...root.querySelectorAll<HTMLElement>('[data-dc-count]')];
  if (!els.length || prefersReduced()) return null;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const raw = el.dataset.dcFinal ?? el.textContent ?? '';
        const parsed = parse(raw);
        if (parsed) run(el, parsed, raw, duration);
      }
    },
    { threshold: 0.55 },
  );

  for (const el of els) {
    const raw = el.textContent ?? '';
    const parsed = parse(raw);
    if (!parsed) continue; // valeur non numérique → statique
    el.dataset.dcFinal = raw;
    el.textContent = `${parsed.prefix}${fmt(0, parsed.decimals)}${parsed.suffix}`;
    io.observe(el);
  }
  return io;
}
