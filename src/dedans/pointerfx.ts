// Micro-interactions pilotées par le pointeur, à l'échelle de la page :
//  - magnétisme : un élément `[data-dc-magnetic]` est légèrement aimanté vers le
//    curseur (force réglée par `data-dc-mag`). Utilisé sur l'email, les liens, le
//    bouton « ouvrir ».
//  - tilt : une carte `[data-dc-tilt]` s'incline en 3D vers le curseur.
// Réservé au pointeur fin sans reduced-motion (instancié seulement dans ce cas).
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

interface Magnetic {
  el: HTMLElement;
  strength: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

interface Tilt {
  el: HTMLElement;
  rx: number;
  ry: number;
  tz: number;
  trx: number;
  try_: number;
  ttz: number;
}

export class PointerFX {
  private readonly mags: Magnetic[];
  private readonly tilts: Tilt[];

  constructor(root: HTMLElement) {
    this.mags = [...root.querySelectorAll<HTMLElement>('[data-dc-magnetic]')].map((el) => {
      const m: Magnetic = { el, strength: parseFloat(el.dataset.dcMag ?? '0.3'), x: 0, y: 0, tx: 0, ty: 0 };
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        m.tx = (e.clientX - (r.left + r.width / 2)) * m.strength;
        m.ty = (e.clientY - (r.top + r.height / 2)) * m.strength;
      });
      el.addEventListener('mouseleave', () => {
        m.tx = 0;
        m.ty = 0;
      });
      return m;
    });

    this.tilts = [...root.querySelectorAll<HTMLElement>('[data-dc-tilt]')].map((el) => {
      const o: Tilt = { el, rx: 0, ry: 0, tz: 0, trx: 0, try_: 0, ttz: 0 };
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        o.try_ = nx * 6;
        o.trx = -ny * 6;
        o.ttz = 24;
      });
      el.addEventListener('mouseleave', () => {
        o.trx = 0;
        o.try_ = 0;
        o.ttz = 0;
      });
      return o;
    });
  }

  tick(): void {
    for (const m of this.mags) {
      m.x = lerp(m.x, m.tx, 0.2);
      m.y = lerp(m.y, m.ty, 0.2);
      m.el.style.transform = `translate(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px)`;
    }
    for (const o of this.tilts) {
      o.rx = lerp(o.rx, o.trx, 0.15);
      o.ry = lerp(o.ry, o.try_, 0.15);
      o.tz = lerp(o.tz, o.ttz, 0.15);
      o.el.style.transform = `perspective(1100px) rotateX(${o.rx.toFixed(2)}deg) rotateY(${o.ry.toFixed(2)}deg) translateZ(${o.tz.toFixed(1)}px)`;
    }
  }
}
