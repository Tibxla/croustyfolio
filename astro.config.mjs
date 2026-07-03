// @ts-check
import { defineConfig } from 'astro/config';

// Config minimale. L'intro est un îlot vanilla TS : Astro bundle les <script>
// de index.astro sans intégration de framework d'UI.
// `site` : domaine de prod, requis pour les URLs absolues (canonical, Open Graph)
// construites dans src/components/Seo.astro via Astro.site.
// `trailingSlash: 'never'` : une seule forme d'URL (sans slash), alignée sur
// `trailingSlash: false` de vercel.json — sinon /edifig et /edifig/ répondent
// tous les deux en 200 et Google choisit sa propre canonique.
export default defineConfig({
  site: 'https://thibaudtl.com',
  trailingSlash: 'never',
});
