// Marquee Stack — la « boucle infinie » de la zone Stack. Deux rangées de tokens
// mono à contre-sens, boucle sans couture, vitesse couplée à la vélocité du scroll
// (mesurée ici depuis window.scrollY → aucune dépendance à Lenis). Les bords en
// fondu et le glitch au survol vivent dans le CSS.
//
// Calm (reduced-motion / mobile) : la classe n'est pas instanciée — le CSS rend
// les tokens en ligne statique.
interface Row {
  track: HTMLElement;
  dir: number; // +1 ou -1
  width: number; // largeur d'une copie
  offset: number; // translation courante
  sets: number; // nombre de copies du contenu dans la piste
}

export class Marquee {
  private readonly rows: Row[] = [];
  private scrollY = window.scrollY;
  private vel = 0;
  private lastT = 0;
  private readonly baseSpeed = 26; // px/s au repos

  constructor(root: HTMLElement) {
    const rowEls = [...root.querySelectorAll<HTMLElement>('[data-dc-marquee-row]')];
    for (const rowEl of rowEls) {
      const track = rowEl.querySelector<HTMLElement>('[data-dc-marquee-track]');
      if (!track) continue;
      // Assez de copies pour remplir les grands écrans sans trou (boucle sans couture).
      const originals = [...track.children];
      const sets = 4;
      for (let i = 1; i < sets; i += 1) for (const c of originals) track.append(c.cloneNode(true));
      const dir = rowEl.dataset.dir === '-1' ? -1 : 1;
      this.rows.push({ track, dir, width: 0, offset: 0, sets });
    }
    this.measure();
  }

  measure(): void {
    for (const row of this.rows) {
      row.width = row.track.scrollWidth / row.sets; // largeur d'une copie
    }
  }

  tick(): void {
    const now = performance.now();
    const dt = Math.min(this.lastT ? now - this.lastT : 16, 64) / 1000;
    this.lastT = now;

    const y = window.scrollY;
    this.vel = this.vel * 0.9 + Math.abs(y - this.scrollY) * 0.1;
    this.scrollY = y;

    // Boost à la vélocité du scroll, mais CAPÉ → pas de sursaut quand on scrolle vite.
    const speed = this.baseSpeed + Math.min(this.vel, 26) * 9;
    for (const row of this.rows) {
      if (row.width <= 0) continue;
      row.offset -= row.dir * speed * dt;
      if (row.offset <= -row.width) row.offset += row.width;
      else if (row.offset > 0) row.offset -= row.width;
      row.track.style.transform = `translate3d(${row.offset.toFixed(2)}px, 0, 0)`;
    }
  }
}
