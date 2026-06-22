// Curseur : on garde le curseur natif (« classique »), avec un petit effet
// terminal — un caret bloc clignotant qui suit le pointeur avec un léger retard,
// posé juste à droite du curseur (façon caret de terminal qui rattrape sa place).
// Réservé au pointeur fin sans reduced-motion ; le curseur natif n'est jamais masqué.
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class Cursor {
  private readonly el: HTMLElement;
  private x = window.innerWidth / 2;
  private y = window.innerHeight / 2;

  constructor(private readonly root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'dc-caret';
    this.el.setAttribute('aria-hidden', 'true');
    root.appendChild(this.el);
  }

  enable(): void {
    this.root.dataset.dcCursor = ''; // affiche le caret (curseur natif conservé)
  }

  disable(): void {
    delete this.root.dataset.dcCursor;
  }

  update(mx: number, my: number): void {
    this.x = lerp(this.x, mx, 0.18);
    this.y = lerp(this.y, my, 0.18);
    // posé un peu à droite du pointeur, centré verticalement
    this.el.style.transform = `translate(${(this.x + 9).toFixed(2)}px, ${this.y.toFixed(2)}px) translate(0, -50%)`;
  }

  dispose(): void {
    this.disable();
    this.el.remove();
  }
}
