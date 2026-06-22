// Sélection — liste verticale de projets (inspiré Tajmirul/portfolio-2.0) : au
// survol d'une ligne, les autres s'estompent et une preview (la télémétrie du
// projet) suit le curseur. Scroll natif, aucun pin. Desktop (`enabled`) seulement ;
// en mode calm le CSS rend une liste à plat lisible et ce module reste muet.
import { scramble } from './texteffects';
import { countElement } from './counters';

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class Gallery {
  private readonly list: HTMLElement | null;
  private readonly preview: HTMLElement | null;
  private readonly container: HTMLElement | null;
  private readonly topprogEl: HTMLElement | null;
  private readonly rows: HTMLElement[];
  private readonly panels = new Map<string, HTMLElement>();
  private overList = false;
  private targetY = 0;
  private curY = 0;
  private active: string | null = null;
  private mx = window.innerWidth;
  private my = 0;
  private px = 0;
  private py = 0;

  constructor(
    root: HTMLElement,
    private readonly enabled: boolean,
  ) {
    this.list = root.querySelector('[data-dc-projlist]');
    this.preview = root.querySelector('[data-dc-projpreview]');
    this.container = root.querySelector('[data-dc-gallery]');
    this.topprogEl = root.querySelector('[data-dc-topprog]');
    this.rows = [...root.querySelectorAll<HTMLElement>('[data-dc-proj]')];
    for (const el of root.querySelectorAll<HTMLElement>('[data-dc-prev]')) {
      const slug = el.dataset.dcPrev;
      if (slug) this.panels.set(slug, el);
    }
    if (this.enabled) this.bind();
  }

  private bind(): void {
    for (const row of this.rows) {
      row.addEventListener('mouseenter', () => this.activate(row.dataset.dcSlug ?? null));
    }
    if (this.list) {
      this.list.addEventListener('mouseenter', () => {
        this.overList = true;
      });
      this.list.addEventListener('mouseleave', () => {
        this.overList = false;
        this.activate(null);
      });
    }
    window.addEventListener('mousemove', (e) => {
      this.mx = e.clientX;
      this.my = e.clientY;
      this.onMove(e.clientY);
    });
  }

  // Active une ligne : estompe les autres, montre sa preview (et l'allume si une
  // ligne est survolée, l'éteint sinon).
  private activate(slug: string | null): void {
    if (slug === this.active) return;
    this.active = slug;
    const has = slug !== null;
    for (const row of this.rows) {
      row.toggleAttribute('data-active', has && row.dataset.dcSlug === slug);
    }
    for (const [s, panel] of this.panels) {
      panel.toggleAttribute('data-on', s === slug);
    }
    this.preview?.toggleAttribute('data-on', has);
    this.list?.toggleAttribute('data-dc-hover', has);
    // CHG-3 : à chaque changement, le contenu « se recharge » — la tagline se
    // déchiffre, les métriques roulent de 0 vers leur valeur.
    if (has && slug) {
      const panel = this.panels.get(slug);
      if (panel) this.morphPanel(panel);
    }
  }

  private morphPanel(panel: HTMLElement): void {
    const tagline = panel.querySelector<HTMLElement>('.dc-prev__tagline');
    if (tagline) {
      const final = tagline.dataset.dcFinal ?? tagline.textContent ?? '';
      tagline.dataset.dcFinal = final;
      scramble(tagline, final, { duration: 600 });
    }
    panel.querySelectorAll<HTMLElement>('.dc-prev__num').forEach((n) => countElement(n, 700));
  }

  private onMove(clientY: number): void {
    if (!this.overList || !this.container || !this.preview) return;
    const rect = this.container.getBoundingClientRect();
    const ph = this.preview.offsetHeight;
    this.targetY = clamp(clientY - rect.top - ph / 2, 0, Math.max(0, rect.height - ph));
  }

  // Plus de géométrie à recalculer (pas de piste horizontale). Gardé pour l'API.
  layout(): void {}

  tick(): void {
    if (this.enabled && this.preview) {
      this.curY = lerp(this.curY, this.targetY, 0.14);
      // 3D-2 : parallaxe interne — le fond décalé (::before) se déplace selon le
      // curseur (--px/--py), ce qui révèle l'épaisseur de la carte (pas d'inclinaison).
      const tpx = clamp((this.mx / window.innerWidth) * 2 - 1, -1, 1);
      const tpy = clamp((this.my / window.innerHeight) * 2 - 1, -1, 1);
      this.px = lerp(this.px, tpx, 0.1);
      this.py = lerp(this.py, tpy, 0.1);
      this.preview.style.setProperty('--px', this.px.toFixed(3));
      this.preview.style.setProperty('--py', this.py.toFixed(3));
      this.preview.style.transform = `translateY(${this.curY.toFixed(1)}px)`;
    }
    // Progression de lecture (barre du haut).
    if (this.topprogEl) {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const p = total > 0 ? clamp(doc.scrollTop / total, 0, 1) : 0;
      this.topprogEl.style.transform = `scaleX(${p.toFixed(4)})`;
    }
  }

  dispose(): void {}
}
