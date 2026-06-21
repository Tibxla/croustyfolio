# Frames sur canvas plutôt que `<video>` pour le Scrub de l'Intro

Décision : l'Intro est scrubée au scroll en dessinant une **séquence d'images sur un `<canvas>`**, pas en pilotant le `currentTime` d'un élément `<video>`.

Pourquoi : le seeking vidéo HTML5 est saccadé (il dépend des keyframes/GOP) et iOS/Safari throttle ou bloque le scrub vidéo — inacceptable sur la première impression du site. La séquence de frames est frame-accurate et fluide partout.

Le footage est quasi blanc, donc WebP compresse très bien malgré la 2K : **244 frames WebP en 2560px ≈ 8,1 Mo** (source vidéo 2560×1440 / 30 fps), préchargées avant d'activer le scrub. La résolution native 2560 est conservée pour la netteté (la 1920 a été jugée trop molle à l'œil). AVIF écarté (mesuré _plus lourd_ que WebP sur ce contenu quasi-blanc, et lent à encoder). Les frames sont générées par `ffmpeg` et commitées ; le `.mp4` source et un script de régénération sont conservés.
