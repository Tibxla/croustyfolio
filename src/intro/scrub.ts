// Dessine une frame de l'Intro sur le canvas, en mode « cover » (remplit le
// viewport quel que soit le ratio). Ne re-dessine que si l'index change.
export class Scrub {
  private readonly ctx: CanvasRenderingContext2D;
  private current = -1;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly images: readonly HTMLImageElement[],
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Contexte canvas 2D indisponible');
    this.ctx = ctx;
    this.resize();
  }

  // Adapte la résolution interne au viewport (DPR plafonné à 2) et re-dessine.
  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    const last = this.current;
    this.current = -1;
    if (last >= 0) this.draw(last);
  }

  draw(index: number): void {
    const i = Math.max(0, Math.min(this.images.length - 1, Math.round(index)));
    if (i === this.current) return;
    const img = this.images[i];
    if (!img) return;
    this.current = i;
    this.drawCover(img);
  }

  private drawCover(img: HTMLImageElement): void {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
}
