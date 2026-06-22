// La Sélection — les projets du monde « dedans ».
//
// Données RÉELLES et vérifiées (CV canonique + GitHub + vault). Anti-invention :
// on ne met ici qu'un fait sourcé. Une fiche montre la TÉLÉMÉTRIE du projet — la
// donnée EST le visuel (cf. CONTEXT.md « Fiche système »). `shot` n'est renseigné
// que pour un projet en ligne dont on a une vraie capture (rendue « écran CRT ») ;
// à défaut la fiche retombe proprement sur la variante pleine télémétrie.

export type ProjectStatus = 'prod' | 'live' | 'oss' | 'wip';

export interface ProjectLink {
  /** `case` = étude de cas interne ; `live` = site en ligne ; `code` = repo public. */
  readonly kind: 'live' | 'code' | 'case';
  readonly label: string;
  readonly href: string;
}

export interface ProjectMetric {
  /** Valeur affichée. Si elle est numérique, elle s'incrémente à la révélation. */
  readonly value: string;
  readonly label: string;
}

export interface Project {
  readonly n: string; // identifiant affiché (01…)
  readonly slug: string;
  readonly title: string;
  readonly tagline: string; // une ligne, sans le « > » (ajouté au rendu)
  readonly context: string; // « Le Figaro · 2026 »
  readonly status: ProjectStatus;
  readonly statusLabel: string;
  readonly stack: readonly string[];
  readonly metrics: readonly ProjectMetric[];
  readonly proof: readonly string[];
  readonly links: readonly ProjectLink[];
  readonly shot?: string; // chemin d'une vraie capture → variante écran CRT
}

export const PROJECTS: readonly Project[] = [
  {
    n: '01',
    slug: 'edifig',
    title: 'Edifig',
    tagline: 'chemin de fer numérique — Propriétés Le Figaro',
    context: 'Le Figaro · 2026',
    status: 'prod',
    statusLabel: 'en production',
    stack: ['Next.js 16', 'TypeScript', 'PostgreSQL', 'Okta OIDC', 'SSE'],
    metrics: [
      { value: '42 000', label: 'lignes' },
      { value: '1 443', label: 'commits' },
      { value: '30', label: 'ADR' },
      { value: '~1 600', label: 'tests' },
    ],
    proof: ['Stage noté 19/20', 'Utilisé par la rédaction Propriétés'],
    // Confidentiel (DSI Figaro) : pas de live ni de repo public → étude de cas interne.
    links: [{ kind: 'case', label: 'cat étude_de_cas', href: '/edifig' }],
  },
  {
    n: '02',
    slug: 'au5000',
    title: 'Au5000',
    tagline: 'site de location premium, bilingue',
    context: 'Client · 2026',
    status: 'live',
    statusLabel: 'en ligne',
    stack: ['Next.js 16', 'React 19', 'Supabase', 'Tailwind v4', 'GSAP'],
    metrics: [
      { value: '100', label: 'Lighthouse SEO' },
      { value: 'FR · EN', label: 'bilingue' },
      { value: '18', label: 'tables' },
    ],
    proof: ['En ligne · 5,0★ (6 avis) · CITQ'],
    // TODO(thibaud) : au5000.com quand le domaine pointera dessus (netlify pour l'instant).
    links: [{ kind: 'live', label: 'voir le site', href: 'https://au5000.netlify.app/fr' }],
    // shot : déposer une capture curatée dans public/shots/au5000.webp puis renseigner ce champ.
  },
  {
    n: '03',
    slug: 'croustylift',
    title: 'Croustylift',
    tagline: 'tracker de muscu local-first',
    context: 'Produit · 2026',
    status: 'oss',
    statusLabel: 'open source',
    stack: ['React 19', 'Vite', 'TypeScript', 'Supabase', 'Tailwind v4'],
    metrics: [
      { value: '642', label: 'tests TDD' },
      { value: '9', label: 'modules domaine' },
      { value: 'PWA', label: 'offline-first' },
    ],
    proof: ['Local-first, sync last-write-wins'],
    links: [{ kind: 'code', label: 'code', href: 'https://github.com/Tibxla/croustylift' }],
  },
  {
    n: '04',
    slug: 'ccroustyflow',
    title: 'CCroustyflow',
    tagline: "orchestrateur d'agents IA — workflow TDD",
    context: 'Outillage IA · 2026',
    status: 'wip',
    statusLabel: 'projet perso',
    stack: ['TypeScript', 'Bash', 'Claude Code'],
    metrics: [
      { value: '7', label: 'agents' },
      { value: '8', label: 'skills' },
      { value: '19', label: 'commandes' },
    ],
    proof: ['Workflow TDD strict, orchestré de bout en bout'],
    // TODO(thibaud) : repo privé ? Activer le lien `code` une fois public.
    links: [],
  },
  {
    n: '05',
    slug: 'crypto-graph',
    title: 'Crypto-Graph',
    tagline: 'dataviz blockchain — crash WETH / Polygon',
    context: 'Dataviz · 2026',
    status: 'live',
    statusLabel: 'en ligne',
    stack: ['React', 'TypeScript', 'D3.js', 'Vite', 'shadcn/ui'],
    metrics: [
      { value: '12 880', label: 'nœuds' },
      { value: '12 000+', label: 'arêtes' },
      { value: '0,978', label: 'indice Gini' },
    ],
    proof: ['Rapport LaTeX — Licence MIAGE'],
    // TODO(verif) : confirmer les URLs exactes (repo + déploiement Vercel).
    links: [
      { kind: 'live', label: 'démo', href: 'https://crypto-graph-explorer.vercel.app' },
      { kind: 'code', label: 'code', href: 'https://github.com/Tibxla/Crypto-Graph-Explorer' },
    ],
  },
];
