import { FRAME_COUNT, frameUrl } from './frames';

export type PreloadProgress = (loaded: number, total: number) => void;

// Précharge toutes les frames en HTMLImageElement et les décode en amont,
// pour qu'aucun coût de décodage ne tombe pendant le scrub.
export async function preloadFrames(onProgress?: PreloadProgress): Promise<HTMLImageElement[]> {
  const images = new Array<HTMLImageElement>(FRAME_COUNT);
  let loaded = 0;

  const loadOne = async (i: number): Promise<void> => {
    const img = new Image();
    img.decoding = 'async';
    img.src = frameUrl(i);
    try {
      await img.decode();
    } catch {
      // decode() rejette (EncodingError) quand l'onglet passe en arrière-plan.
      // L'image est alors souvent DÉJÀ chargée, donc son `onload` ne refirera plus :
      // sans le garde `img.complete`, on attendrait un événement mort → le pool de
      // workers se fige et le chargement ne reprend jamais au retour sur l'onglet.
      await new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    }
    images[i] = img;
    loaded += 1;
    onProgress?.(loaded, FRAME_COUNT);
  };

  // Pool à concurrence limitée : les premières frames arrivent en premier
  // (le bureau blanc est affichable tôt) sans saturer le réseau.
  const CONCURRENCY = 8;
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < FRAME_COUNT) {
      await loadOne(next++);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return images;
}
