// Ticker « plaque signalétique » du Chargement : un ruban de jetons d'identité
// (TIBXLA · DÉVELOPPEUR · …) posé sur une courbe légère, qui défile lentement et
// qu'on peut traîner. Vit DANS le dehors (voix bureau : mono majuscule espacé,
// faible opacité) — délibérément distinct du marquee DROIT du dedans (zone Stack,
// src/dedans/marquee.ts), la courbe servant à les démarquer. Monté dans
// .intro__loader, il meurt avec le chargement (cf. src/intro/index.ts).
//
// Technique empruntée à « Curved Loop » (React Bits), portée en vanilla : un
// <path> courbe invisible + un <textPath> dont le texte (jetons répétés) défile
// en faisant varier startOffset, wrap modulo la longueur d'une copie (boucle sans
// couture). Le drag est volontairement MÉCANIQUE : au relâché, la vitesse rejoint
// l'auto par lerp (pas de ressort/rebond) → on traîne une pièce d'appareil.
//
// Pas de fallback reduced-motion : ces visiteurs (et le tactile) ne voient jamais
// l'Intro (root.remove(), cf. docs/adr/0004), donc jamais ce ticker.

const SVGNS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

// Géométrie en unités viewBox. Le chemin déborde largement le cadre des deux
// côtés pour que le texte entre/sorte hors écran.
const VB_W = 1000;
const VB_H = 120;
const BASE_Y = 60; // ligne au centre vertical → survit au crop slice
const OVERHANG = 1500;
const COPIES = 8; // assez de copies pour couvrir la zone visible quel que soit le wrap

export interface NameplateOptions {
  /** Une copie des jetons, séparateur de fin inclus (`… 2026 · `) pour une couture régulière. */
  text: string;
  /** Vitesse auto en unités viewBox / frame. */
  speed?: number;
  /** Affaissement de la courbe en unités viewBox. */
  curve?: number;
}

export class Nameplate {
  private readonly host: HTMLElement;
  private readonly svg: SVGSVGElement;
  private readonly textPath: SVGTextPathElement;
  private readonly speed: number;

  private raf = 0;
  private offset = 0;
  private vel: number;
  private singleLen = 0;
  private dragging = false;
  private lastX = 0;

  private readonly onMove: (e: PointerEvent) => void;
  private readonly onUp: () => void;
  private readonly onResize: () => void;
  private readonly tick: () => void;

  constructor(host: HTMLElement, opts: NameplateOptions) {
    this.host = host;
    this.speed = opts.speed ?? 0.85;
    this.vel = -this.speed;
    const curve = opts.curve ?? 26;

    const cx = VB_W / 2;
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('class', 'intro__plate-svg');
    this.svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('id', 'intro-plate-curve');
    path.setAttribute('fill', 'none');
    // Léger affaissement façon ruban suspendu (contrôle sous la ligne de base).
    path.setAttribute('d', `M ${cx - OVERHANG} ${BASE_Y} Q ${cx} ${BASE_Y + curve} ${cx + OVERHANG} ${BASE_Y}`);

    const text = document.createElementNS(SVGNS, 'text');
    text.setAttribute('class', 'intro__plate-text');

    this.textPath = document.createElementNS(SVGNS, 'textPath');
    this.textPath.setAttributeNS(XLINK, 'xlink:href', '#intro-plate-curve');
    this.textPath.setAttribute('href', '#intro-plate-curve');
    this.textPath.textContent = opts.text.repeat(COPIES);

    text.appendChild(this.textPath);
    this.svg.appendChild(path);
    this.svg.appendChild(text);
    this.host.appendChild(this.svg);

    this.onMove = (e) => this.moveDrag(e);
    this.onUp = () => this.endDrag();
    this.onResize = () => this.measure();
    this.tick = () => this.frame();

    this.svg.addEventListener('pointerdown', (e) => this.startDrag(e));
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('resize', this.onResize);
    // La largeur dépend de la police réelle (IBM Plex Mono) : re-mesurer quand
    // les webfonts sont prêtes, sinon la couture saute d'un sous-glyphe.
    document.fonts?.ready.then(() => this.measure()).catch(() => {});
  }

  start(): void {
    this.measure();
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private measure(): void {
    const total = this.textPath.getComputedTextLength();
    if (total > 0) this.singleLen = total / COPIES;
  }

  private toUnits(clientDx: number): number {
    const w = this.svg.clientWidth || VB_W;
    return clientDx * (VB_W / w);
  }

  private startDrag(e: PointerEvent): void {
    this.dragging = true;
    this.lastX = e.clientX;
    this.vel = 0;
    this.host.classList.add('is-grabbing');
    try {
      this.svg.setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture peut échouer selon le contexte : sans gravité */
    }
  }

  private moveDrag(e: PointerEvent): void {
    if (!this.dragging) return;
    const dx = this.toUnits(e.clientX - this.lastX);
    this.lastX = e.clientX;
    this.offset += dx;
    this.vel = dx; // reporté au relâché → inertie
  }

  private endDrag(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.host.classList.remove('is-grabbing');
  }

  private frame(): void {
    if (!this.dragging) {
      // Inertie mécanique : la vitesse rejoint l'auto par lerp lent (pas de ressort).
      this.vel += (-this.speed - this.vel) * 0.035;
      this.offset += this.vel;
    }
    if (this.singleLen <= 0) this.measure();
    if (this.singleLen > 0) {
      // Garde startOffset dans [0, singleLen) → jamais négatif, boucle sans couture.
      this.offset %= this.singleLen;
      if (this.offset < 0) this.offset += this.singleLen;
    }
    this.textPath.setAttribute('startOffset', String(this.offset));
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('resize', this.onResize);
    this.svg.remove();
  }
}
