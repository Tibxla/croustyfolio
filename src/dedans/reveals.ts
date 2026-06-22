// Révélations à l'entrée dans le viewport : montée + fondu + défocus.
// Progressive enhancement strict — le contenu est visible par défaut ; on ne
// l'efface (`data-dc-enhanced` sur <html>, géré en CSS) que si le JS tourne et
// que reduced-motion est absent. Si le JS échoue, rien ne reste caché.
export function initReveals(root: HTMLElement): IntersectionObserver {
  document.documentElement.dataset.dcEnhanced = '';

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.dcShown = '';
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.16 },
  );

  root.querySelectorAll<HTMLElement>('[data-dc-reveal]').forEach((el) => io.observe(el));
  return io;
}
