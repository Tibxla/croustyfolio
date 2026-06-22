// Fond « dot field » — porté de React Bits (composant DotField) vers du vanilla
// TS, sans React ni dépendance (canvas 2D pur).
// https://reactbits.dev — DotField : « Interactive dot grid with cursor bulge ».
//
// Une grille de points fixes ; quand la souris bouge, les points proches
// s'écartent du curseur (bulge) proportionnellement à la vitesse, puis reviennent
// à leur ancre (ressort). Au repos, grille immobile. Adapté ici en N&B sur noir.
const TWO_PI = Math.PI * 2;

interface Dot {
  ax: number; // ancre
  ay: number;
  sx: number; // position lissée (ressort)
  sy: number;
}

export interface DotFieldOptions {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export class DotField {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr = Math.min(window.devicePixelRatio || 1, 2);
  private readonly o: Required<DotFieldOptions>;

  private dots: Dot[] = [];
  private w = 0;
  private h = 0;
  private readonly mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  private engagement = 0;
  private frame = 0;

  private raf = 0;
  private speedTimer = 0;
  private resizeTimer = 0;
  private running = false;

  private readonly onMove: (e: MouseEvent) => void;
  private readonly onResize: () => void;

  constructor(
    private readonly container: HTMLElement,
    opts: DotFieldOptions = {},
  ) {
    this.o = {
      dotRadius: 1.6,
      dotSpacing: 16,
      cursorRadius: 460,
      bulgeStrength: 64,
      waveAmplitude: 0,
      gradientFrom: 'rgba(236, 236, 240, 0.42)',
      gradientTo: 'rgba(236, 236, 240, 0.13)',
      ...opts,
    };

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    });
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('canvas 2D indisponible (DotField)');
    this.ctx = ctx;

    this.onMove = (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    };
    this.onResize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.measure();
        if (!this.running) this.draw();
      }, 100);
    };

    this.measure();
    window.addEventListener('mousemove', this.onMove, { passive: true });
    window.addEventListener('resize', this.onResize);
  }

  private measure(): void {
    const rect = this.container.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.build();
  }

  private build(): void {
    const step = this.o.dotRadius + this.o.dotSpacing;
    const cols = Math.floor(this.w / step);
    const rows = Math.floor(this.h / step);
    const padX = (this.w % step) / 2;
    const padY = (this.h % step) / 2;
    const dots: Dot[] = new Array(rows * cols);
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[i++] = { ax, ay, sx: ax, sy: ay };
      }
    }
    this.dots = dots;
  }

  // Vitesse du pointeur (lissée) — pilote l'engagement (l'effet ne s'active qu'en
  // mouvement). Échantillonnée à intervalle fixe comme le composant d'origine.
  private updateSpeed(): void {
    const m = this.mouse;
    const dx = m.prevX - m.x;
    const dy = m.prevY - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    m.speed += (dist - m.speed) * 0.5;
    if (m.speed < 0.001) m.speed = 0;
    m.prevX = m.x;
    m.prevY = m.y;
  }

  private draw(): void {
    const { ctx, dots, o, mouse: m } = this;
    const t = this.frame * 0.02;

    const targetEng = Math.min(m.speed / 5, 1);
    this.engagement += (targetEng - this.engagement) * 0.06;
    if (this.engagement < 0.001) this.engagement = 0;
    const eng = this.engagement;

    ctx.clearRect(0, 0, this.w, this.h);
    const grad = ctx.createLinearGradient(0, 0, this.w, this.h);
    grad.addColorStop(0, o.gradientFrom);
    grad.addColorStop(1, o.gradientTo);
    ctx.fillStyle = grad;

    const cr = o.cursorRadius;
    const crSq = cr * cr;
    const rad = o.dotRadius / 2;

    ctx.beginPath();
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = m.x - d.ax;
      const dy = m.y - d.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && eng > 0.01) {
        const dist = Math.sqrt(distSq);
        const k = 1 - dist / cr;
        const push = k * k * o.bulgeStrength * eng;
        const angle = Math.atan2(dy, dx);
        d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
        d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
      } else {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      let drawX = d.sx;
      let drawY = d.sy;
      if (o.waveAmplitude > 0) {
        drawY += Math.sin(d.ax * 0.03 + t) * o.waveAmplitude;
        drawX += Math.cos(d.ay * 0.03 + t * 0.7) * o.waveAmplitude * 0.5;
      }

      ctx.moveTo(drawX + rad, drawY);
      ctx.arc(drawX, drawY, rad, 0, TWO_PI);
    }
    ctx.fill();
  }

  private tick = (): void => {
    this.frame++;
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.speedTimer = window.setInterval(() => this.updateSpeed(), 20);
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearInterval(this.speedTimer);
  }

  // Mode calm : grille au repos, dessinée une fois.
  renderStatic(): void {
    this.draw();
  }

  dispose(): void {
    this.stop();
    clearTimeout(this.resizeTimer);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('resize', this.onResize);
    this.canvas.remove();
  }
}
