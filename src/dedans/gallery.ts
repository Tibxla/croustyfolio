// Galerie des projets : on la scrube horizontalement comme l'Intro. Une section
// haute (`.dc-gallery`) sert de piste de scroll ; à l'intérieur, un bloc `sticky`
// plein écran tient la `.dc-track` qu'on translate selon la progression — donc
// « le scroll reste le bouton », sans lecture auto. Pendant qu'on scrube vite,
// les titres se dédoublent en chroma (écho de l'aberration de l'Intro).
//
// En mode « calm » (mobile / reduced-motion) la galerie n'est pas activée : le
// CSS la rend en simple liste verticale et ce module reste muet.
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export class Gallery {
  private readonly galleryEl: HTMLElement | null;
  private readonly trackEl: HTMLElement | null;
  private readonly progEl: HTMLElement | null;
  private readonly topprogEl: HTMLElement | null;
  private readonly titles: HTMLElement[];
  private readonly parallax: HTMLElement[];
  private readonly cards: HTMLElement[];
  private readonly hover = new Map<HTMLElement, boolean>();

  private scrub = 0;
  private scrubTarget = 0;
  private scrubVel = 0;
  private travel = 0;

  constructor(
    root: HTMLElement,
    private readonly enabled: boolean,
  ) {
    this.galleryEl = root.querySelector('[data-dc-gallery]');
    this.trackEl = root.querySelector('[data-dc-track]');
    this.progEl = root.querySelector('[data-dc-prog]');
    this.topprogEl = root.querySelector('[data-dc-topprog]');
    this.titles = [...root.querySelectorAll<HTMLElement>('[data-dc-title]')];
    this.parallax = [...root.querySelectorAll<HTMLElement>('[data-dc-parallax]')];
    this.cards = [...root.querySelectorAll<HTMLElement>('[data-dc-card]')];

    if (this.enabled) {
      for (const card of this.cards) {
        card.addEventListener('mouseenter', () => this.hover.set(card, true));
        card.addEventListener('mouseleave', () => this.hover.set(card, false));
      }
      this.layout();
    }
  }

  // Hauteur de la piste de scroll = un écran + le débordement horizontal de la
  // track (mapping ~1:1 : un pixel scrollé → un pixel translaté).
  layout(): void {
    if (!this.enabled || !this.galleryEl || !this.trackEl) return;
    this.travel = Math.max(0, this.trackEl.scrollWidth - window.innerWidth);
    this.galleryEl.style.height = `${window.innerHeight + this.travel}px`;
  }

  private measure(): void {
    if (this.galleryEl) {
      const rect = this.galleryEl.getBoundingClientRect();
      const total = this.galleryEl.offsetHeight - window.innerHeight;
      this.scrubTarget = clamp(total > 0 ? -rect.top / total : 0, 0, 1);
    }
    if (this.topprogEl) {
      const doc = document.documentElement;
      const totalDoc = doc.scrollHeight - window.innerHeight;
      const gp = totalDoc > 0 ? doc.scrollTop / totalDoc : 0;
      this.topprogEl.style.transform = `scaleX(${clamp(gp, 0, 1).toFixed(4)})`;
    }
  }

  tick(): void {
    if (!this.enabled) return;
    this.measure();

    const prev = this.scrub;
    this.scrub = lerp(this.scrub, this.scrubTarget, 0.16);
    this.scrubVel = this.scrubVel * 0.82 + Math.abs(this.scrub - prev) * 0.18;

    if (this.trackEl) {
      this.trackEl.style.transform = `translate3d(${(-this.scrub * this.travel).toFixed(2)}px, 0, 0)`;
    }
    if (this.progEl) this.progEl.style.transform = `scaleX(${this.scrub.toFixed(4)})`;

    // Aberration chroma des titres : selon la vitesse de scrub + bonus au survol.
    const base = clamp(this.scrubVel * 120, 0, 8);
    for (const title of this.titles) {
      const card = title.closest<HTMLElement>('[data-dc-card]');
      const s = base + (card && this.hover.get(card) ? 3 : 0);
      if (s > 0.15) {
        title.style.textShadow = `${s.toFixed(1)}px 0 rgba(255,42,92,.7), ${(-s).toFixed(1)}px 0 rgba(0,198,255,.7)`;
        title.style.color = card && this.hover.get(card) ? '#ffffff' : '';
      } else if (title.style.textShadow !== '') {
        title.style.textShadow = '';
        title.style.color = '';
      }
    }

    // Parallaxe de profondeur : le grand numéro fantôme dérive selon la position
    // de sa carte par rapport au centre du viewport.
    if (this.parallax.length) {
      const vc = window.innerWidth / 2;
      for (const el of this.parallax) {
        const host = el.closest<HTMLElement>('[data-dc-card]') ?? el;
        const rect = host.getBoundingClientRect();
        const factor = parseFloat(el.dataset.dcParallax ?? '0.06');
        const off = (rect.left + rect.width / 2 - vc) * factor;
        el.style.transform = `translateX(${off.toFixed(1)}px)`;
      }
    }
  }

  dispose(): void {
    if (this.galleryEl) this.galleryEl.style.height = '';
    if (this.trackEl) this.trackEl.style.transform = '';
  }
}
