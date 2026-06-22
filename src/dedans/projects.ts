// Index des projets du monde « dedans ».
// Placeholders pour l'instant — édite ce tableau quand les vrais projets arrivent.
// Le n° (`n`) est l'identifiant affiché ; il sert aussi de fallback visuel.
export interface Project {
  readonly n: string;
  readonly title: string;
  readonly year: string;
  readonly type: string;
  readonly stack: string;
}

export const PROJECTS: readonly Project[] = [
  { n: '01', title: 'Refonte e-commerce', year: '2025', type: 'Site marchand', stack: 'Astro · Stripe' },
  { n: '02', title: 'Dashboard SaaS', year: '2025', type: 'Application web', stack: 'React · D3' },
  { n: '03', title: 'Site éditorial', year: '2024', type: 'Site vitrine', stack: 'Next · CMS' },
  { n: '04', title: 'App mobile', year: '2024', type: 'PWA', stack: 'React Native' },
  { n: '05', title: 'Identité & studio', year: '2023', type: 'Brand + web', stack: 'WebGL · OGL' },
  { n: '06', title: 'Outil interne', year: '2023', type: 'Application web', stack: 'Vue · Node' },
];
