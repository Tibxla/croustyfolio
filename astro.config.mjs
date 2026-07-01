// @ts-check
import { defineConfig } from 'astro/config';

// Config minimale. L'intro est un îlot vanilla TS : Astro bundle les <script>
// de index.astro sans intégration de framework d'UI.
// `site` : domaine de prod, requis pour les URLs absolues (canonical, Open Graph)
// construites dans src/components/Seo.astro via Astro.site.
export default defineConfig({
  site: 'https://thibaudtl.com',
});
