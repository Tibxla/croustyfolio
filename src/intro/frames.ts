// Manifeste des frames de l'Intro.
// Générées par scripts/extract-frames.sh dans public/intro/frames (1-indexées).
export const FRAME_COUNT = 244;

// i ∈ [0, FRAME_COUNT-1] → URL du fichier (f_0001.webp … f_0197.webp).
export const frameUrl = (i: number): string =>
  `/intro/frames/f_${String(i + 1).padStart(4, '0')}.webp`;
