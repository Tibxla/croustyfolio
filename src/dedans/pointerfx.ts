// Micro-interactions pilotées par le pointeur, à l'échelle de la page :
//  - magnétisme : un élément `[data-dc-magnetic]` est légèrement aimanté vers le
//    curseur (force réglée par `data-dc-mag`). Utilisé sur l'email, les liens, le
//    bouton « ouvrir ».
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

export class PointerFX {
  private readonly mags: Magnetic[];

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
  }

  tick(): void {
    for (const m of this.mags) {
      m.x = lerp(m.x, m.tx, 0.2);
      m.y = lerp(m.y, m.ty, 0.2);
      m.el.style.transform = `translate(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px)`;
    }
  }
}
