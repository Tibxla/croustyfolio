// FlowText — distorsion de texte au survol (flowmap + aberration chromatique
// directionnelle + rainbow), façon portfolio T. Guignand. Porté du composant
// React FlowmapText.tsx de Thibaud vers une classe vanilla TS, en utilisant la
// classe `Flowmap` d'OGL (ping-pong + vélocité gérés en interne).
//
// Ajouts pour l'intro CroustyFolio :
//  - canvas en `mix-blend-mode: difference` → texte TOUJOURS inversé sur le fond
//  - ENTRÉE = SORTIE inversée : blow-out chromatique qui se reconstitue (le nom
//    émerge des canaux R/G/B séparés), miroir exact de la sortie
//  - gating : l'effet ne s'alimente QUE quand le curseur survole le texte
import { Renderer, Program, Mesh, Triangle, Texture, Vec2, Flowmap } from 'ogl';

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;    // texture du texte (blanc, alpha = forme)
  uniform sampler2D tFlow;   // flowmap OGL : .rg = vélocité, .b = intensité
  uniform vec2  uMouse;
  uniform float uTime;
  uniform float uAspect;
  uniform float uDisp;
  uniform float uChroma;
  uniform float uRadius;
  uniform float uRainbow;
  uniform float uOpacity;
  uniform float uExit;       // sortie : blow-out chromatique global (0→1)
  uniform vec3  uColor;
  varying vec2 vUv;

  void main() {
    vec3 flow = texture2D(tFlow, vUv).rgb;
    float velo = flow.b;

    // 1) distorsion fluide des UV
    vec2 uv = vUv - flow.xy * uDisp;

    // 2) aberration chromatique directionnelle (offsets asymétriques)
    vec2 toMouse = vUv - uMouse;
    toMouse.x *= uAspect;
    float infl = smoothstep(uRadius, 0.0, length(toMouse)) * velo;
    vec2 dir = normalize(toMouse + 1e-5);
    vec2 off = dir * infl * uChroma;

    // Blow-out de sortie : séparation horizontale globale des canaux qui enfle.
    vec2 exitOff = vec2(uExit * uExit * 0.14, 0.0);
    float aR = texture2D(tMap, uv - off * 1.5 - exitOff).a;
    float aG = texture2D(tMap, uv + off * 0.5).a;
    float aB = texture2D(tMap, uv + off * 1.8 + exitOff).a;

    vec3 col = uColor * vec3(aR, aG, aB);
    float a = max(aR, max(aG, aB));

    // 3) rainbow au-dessus d'un seuil de vitesse
    if (velo > 0.015) {
      float hue = uTime * 0.6 + length(toMouse) * 3.5;
      vec3 rb = vec3(sin(hue) * 0.5 + 0.5, sin(hue + 2.0944) * 0.5 + 0.5, sin(hue + 4.1888) * 0.5 + 0.5);
      col = mix(col, rb, clamp(velo * uRainbow, 0.0, 1.0) * a);
    }

    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

export interface FlowTextOptions {
  name: string;
  role: string;
  reduce?: boolean;
}

export class FlowText {
  private renderer: Renderer;
  private gl: Renderer['gl'];
  private canvas: HTMLCanvasElement;
  private program: Program;
  private mesh: Mesh;
  private flowmap: Flowmap;
  private texture: Texture;
  private textCanvas: HTMLCanvasElement;
  private tctx: CanvasRenderingContext2D;
  private dpr: number;

  private name: string;
  private role: string;
  private readonly params = { disp: 0.5, chroma: 0.03, radius: 0.34, diss: 0.95, rainbow: 0.8 };

  private mouse = new Vec2(0.5, 0.5);
  private velocity = new Vec2(0, 0);
  private last = new Vec2(0.5, 0.5);
  private moved = false;
  private overText = false;
  private opacity = 0; // invisible tant que l'entrée n'a pas joué
  private exit = 1; // 0 = net/visible, 1 = blown-out/invisible
  private exitScroll = 0; // valeur de sortie pilotée par le scroll
  private idle = 999;
  private running = false;
  private raf = 0;
  private t0 = 0;
  private entering = false;
  private enterStart = 0;
  private enterDur = 1.4;

  private onMouse: (e: MouseEvent) => void;
  private onTouch: (e: TouchEvent) => void;
  private ro: ResizeObserver;

  constructor(stage: HTMLElement, opts: FlowTextOptions) {
    this.name = opts.name.toUpperCase();
    this.role = opts.role.toUpperCase();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer = new Renderer({ dpr: this.dpr, alpha: true });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);

    this.canvas = this.gl.canvas;
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      pointerEvents: 'none',
      mixBlendMode: 'difference', // texte toujours inversé sur le fond
    });
    stage.appendChild(this.canvas);

    this.textCanvas = document.createElement('canvas');
    const tctx = this.textCanvas.getContext('2d', { willReadFrequently: true });
    if (!tctx) throw new Error('canvas 2D indisponible (FlowText)');
    this.tctx = tctx;

    this.texture = new Texture(this.gl, { generateMipmaps: false, flipY: true });
    this.flowmap = new Flowmap(this.gl, {
      falloff: this.params.radius,
      dissipation: this.params.diss,
      alpha: 1,
    });

    this.program = new Program(this.gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      uniforms: {
        tMap: { value: this.texture },
        tFlow: this.flowmap.uniform,
        uMouse: { value: new Vec2(0.5, 0.5) },
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uDisp: { value: this.params.disp },
        uChroma: { value: this.params.chroma },
        uRadius: { value: this.params.radius },
        uRainbow: { value: this.params.rainbow },
        uOpacity: { value: 0 },
        uExit: { value: 1 },
        uColor: { value: [1, 1, 1] }, // blanc : l'inversion se fait via mix-blend
      },
    });
    this.mesh = new Mesh(this.gl, { geometry: new Triangle(this.gl), program: this.program });

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(stage);

    this.onMouse = (e) => this.handleMove(e.clientX, e.clientY);
    this.onTouch = (e) => {
      if (e.touches[0]) this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    if (!opts.reduce) {
      window.addEventListener('mousemove', this.onMouse);
      window.addEventListener('touchmove', this.onTouch, { passive: true });
    }
  }

  // --- API ---
  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  start(): void {
    this.t0 = performance.now();
    this.renderer.render({ scene: this.mesh });
    this.wake();
  }

  // Applique une valeur de blow-out v (0 = net/visible, 1 = blown-out/invisible) :
  // les canaux se séparent dès le début, l'opacité ne chute qu'en fin de course.
  private applyExit(v: number): void {
    this.exit = v;
    this.opacity = 1 - Math.max(0, Math.min(1, (v - 0.35) / 0.65));
  }

  // Sortie : blow-out chromatique piloté par le scroll (p 0→1).
  setExit(p: number): void {
    this.exitScroll = p;
    this.wake();
  }

  // Entrée = la sortie inversée : le nom se reconstitue depuis le blow-out (v 1→0).
  playIntro(durationMs = 1400): void {
    this.enterDur = durationMs / 1000;
    this.enterStart = (performance.now() - this.t0) / 1000;
    this.entering = true;
    this.wake();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.program.uniforms.uAspect.value = w / h;
    this.flowmap.aspect = w / h;
    this.redrawText();
    this.wake();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.ro.disconnect();
    window.removeEventListener('mousemove', this.onMouse);
    window.removeEventListener('touchmove', this.onTouch);
    this.gl.canvas.parentElement?.removeChild(this.gl.canvas);
  }

  // --- interne ---
  private handleMove(clientX: number, clientY: number): void {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    const x = (clientX - r.left) / r.width;
    const y = 1 - (clientY - r.top) / r.height;
    this.velocity.set(x - this.last.x, y - this.last.y);
    this.mouse.set(x, y);
    this.last.set(x, y);
    this.moved = true;
    this.overText = this.isOverText(clientX, clientY);
    this.wake();
  }

  // Gating : y a-t-il du texte sous le curseur (alpha dilaté) ?
  private isOverText(clientX: number, clientY: number): boolean {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !this.textCanvas.width) return false;
    const px = Math.round(((clientX - r.left) / r.width) * this.textCanvas.width);
    const py = Math.round(((clientY - r.top) / r.height) * this.textCanvas.height);
    const pad = Math.round(16 * this.dpr);
    const x0 = Math.max(0, px - pad);
    const y0 = Math.max(0, py - pad);
    const bw = Math.min(this.textCanvas.width - x0, pad * 2);
    const bh = Math.min(this.textCanvas.height - y0, pad * 2);
    if (bw <= 0 || bh <= 0) return false;
    const data = this.tctx.getImageData(x0, y0, bw, bh).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 16) return true;
    return false;
  }

  private wake(): void {
    this.idle = 0;
    if (!this.running) {
      this.running = true;
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
  }

  private loop(now: number): void {
    const time = (now - this.t0) / 1000;

    // Valeur de blow-out : entrée (v 1→0, miroir de la sortie) puis scroll.
    if (this.entering) {
      const p = Math.min(1, (time - this.enterStart) / this.enterDur);
      this.applyExit(1 - p);
      if (p >= 1) this.entering = false;
    } else {
      this.applyExit(this.exitScroll);
    }

    this.program.uniforms.uTime.value = time;
    this.program.uniforms.uOpacity.value = this.opacity;
    this.program.uniforms.uExit.value = this.exit;

    // Pas de mouvement cette frame → on coupe l'injection. Hors texte → idem.
    if (!this.moved) {
      this.mouse.set(-1, -1);
      this.velocity.set(0, 0);
    } else if (!this.overText) {
      this.velocity.set(0, 0);
    }
    this.moved = false;

    this.flowmap.mouse.copy(this.mouse);
    this.flowmap.velocity.lerp(this.velocity, this.velocity.len() ? 0.5 : 0.1);
    this.flowmap.update();
    this.program.uniforms.uMouse.value.copy(this.flowmap.mouse);

    this.renderer.render({ scene: this.mesh });

    this.idle = this.entering ? 0 : this.idle + 1;
    if (this.idle > 90) {
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame((n) => this.loop(n));
  }

  private fit(text: string, weight: number, family: string, start: number, maxW: number): number {
    const ctx = this.tctx;
    let size = start;
    while (size > 10) {
      ctx.font = `${weight} ${size.toFixed(0)}px ${family}`;
      if (ctx.measureText(text).width <= maxW) break;
      size *= 0.94;
    }
    return size;
  }

  private redrawText(): void {
    const ctx = this.tctx;
    const w = this.gl.canvas.width;
    const h = this.gl.canvas.height;
    if (!w || !h) return;
    this.textCanvas.width = w;
    this.textCanvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; // toujours blanc : couleur via uColor + inversion mix-blend
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = w / 2;
    const cy = h * 0.42;

    const nameSize = this.fit(this.name, 700, '"Archivo Narrow", sans-serif', h * 0.13, w * 0.86);
    ctx.font = `700 ${nameSize.toFixed(0)}px "Archivo Narrow", sans-serif`;
    ctx.letterSpacing = `${(nameSize * 0.015).toFixed(1)}px`;
    ctx.fillText(this.name, cx, cy);

    const roleSize = Math.min(h * 0.022, w * 0.014);
    ctx.font = `500 ${roleSize.toFixed(0)}px "Schibsted Grotesk", sans-serif`;
    ctx.letterSpacing = `${(roleSize * 0.32).toFixed(1)}px`;
    ctx.fillText(this.role, cx + roleSize * 0.16, cy + nameSize * 0.62);
    ctx.letterSpacing = '0px';

    this.texture.image = this.textCanvas;
    this.texture.needsUpdate = true;
  }
}
