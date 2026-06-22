// Fond « LineWaves » — porté de React Bits (composant LineWaves) vers du vanilla
// TS, via OGL (déjà dépendance). https://reactbits.dev — LineWaves.
//
// Un champ de lignes ondulées qui se déforment (warp) et défilent, réactif au
// curseur (la souris creuse une distorsion locale). Blanc sur noir + léger cycle
// chromatique (N&B + chroma). Canvas plein écran derrière le contenu.
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uResolution;
  uniform float uSpeed;
  uniform float uInnerLines;
  uniform float uOuterLines;
  uniform float uWarpIntensity;
  uniform float uRotation;
  uniform float uEdgeFadeWidth;
  uniform float uColorCycleSpeed;
  uniform float uBrightness;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  uniform bool uEnableMouse;

  #define HALF_PI 1.5707963

  float hashF(float n) { return fract(sin(n * 127.1) * 43758.5453123); }

  float smoothNoise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hashF(i), hashF(i + 1.0), u);
  }

  float displaceA(float coord, float t) {
    float result = sin(coord * 2.123) * 0.2;
    result += sin(coord * 3.234 + t * 4.345) * 0.1;
    result += sin(coord * 0.589 + t * 0.934) * 0.5;
    return result;
  }

  float displaceB(float coord, float t) {
    float result = sin(coord * 1.345) * 0.3;
    result += sin(coord * 2.734 + t * 3.345) * 0.2;
    result += sin(coord * 0.189 + t * 0.934) * 0.3;
    return result;
  }

  vec2 rotate2D(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  void main() {
    vec2 coords = gl_FragCoord.xy / uResolution.xy;
    coords = coords * 2.0 - 1.0;
    coords = rotate2D(coords, uRotation);

    float halfT = uTime * uSpeed * 0.5;
    float fullT = uTime * uSpeed;

    float mouseWarp = 0.0;
    if (uEnableMouse) {
      vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
      float mDist = length(coords - mPos);
      mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
    }

    float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
    float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
    float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
    float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

    vec2 fieldA = vec2(warpAx, warpAy);
    vec2 fieldB = vec2(warpBx, warpBy);
    vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

    float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
    float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
    float vMask = 1.0 - max(fadeTop, fadeBottom);

    float tileCount = mix(uOuterLines, uInnerLines, vMask);
    float scaledY = blended.y * tileCount;
    float nY = smoothNoise(abs(scaledY));

    float ridge = pow(
      step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
      5.0
    );

    float lines = 0.0;
    for (float i = 1.0; i < 3.0; i += 1.0) {
      lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
    }

    float pattern = vMask * lines;

    float cycleT = fullT * uColorCycleSpeed;
    float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
    float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
    float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

    vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
    float alpha = clamp(length(col), 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

const hexToVec3 = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

export interface LineWavesOptions {
  speed?: number;
  innerLineCount?: number;
  outerLineCount?: number;
  warpIntensity?: number;
  rotation?: number;
  edgeFadeWidth?: number;
  colorCycleSpeed?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  mouseInfluence?: number;
}

export class LineWaves {
  private renderer: Renderer | null = null;
  private program!: Program;
  private mesh!: Mesh;
  private readonly t0 = performance.now();

  private readonly cur: [number, number] = [0.5, 0.5];
  private readonly target: [number, number] = [0.5, 0.5];

  private raf = 0;
  private running = false;

  // Le canvas est en pointer-events:none (fond) → on écoute la souris sur la
  // fenêtre et on convertit en UV (le canvas est plein écran).
  private readonly onMove = (e: MouseEvent): void => {
    this.target[0] = e.clientX / window.innerWidth;
    this.target[1] = 1 - e.clientY / window.innerHeight;
  };
  private readonly onResize = (): void => this.resize();

  constructor(
    private readonly container: HTMLElement,
    opts: LineWavesOptions = {},
  ) {
    const o = {
      speed: 0.3,
      innerLineCount: 32,
      outerLineCount: 36,
      warpIntensity: 1.0,
      rotation: -45,
      edgeFadeWidth: 0.0,
      colorCycleSpeed: 1.0,
      brightness: 0.2,
      color1: '#ffffff',
      color2: '#ffffff',
      color3: '#ffffff',
      mouseInfluence: 2.0,
      ...opts,
    };

    try {
      this.renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    } catch {
      this.renderer = null; // pas de WebGL : fond CSS noir
      return;
    }
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    });

    this.program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1, 1] },
        uSpeed: { value: o.speed },
        uInnerLines: { value: o.innerLineCount },
        uOuterLines: { value: o.outerLineCount },
        uWarpIntensity: { value: o.warpIntensity },
        uRotation: { value: (o.rotation * Math.PI) / 180 },
        uEdgeFadeWidth: { value: o.edgeFadeWidth },
        uColorCycleSpeed: { value: o.colorCycleSpeed },
        uBrightness: { value: o.brightness },
        uColor1: { value: hexToVec3(o.color1) },
        uColor2: { value: hexToVec3(o.color2) },
        uColor3: { value: hexToVec3(o.color3) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: o.mouseInfluence },
        uEnableMouse: { value: true },
      },
    });
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });
    container.appendChild(gl.canvas);

    window.addEventListener('mousemove', this.onMove, { passive: true });
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  ok(): boolean {
    return this.renderer !== null;
  }

  private resize(): void {
    if (!this.renderer) return;
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    const gl = this.renderer.gl;
    this.program.uniforms.uResolution.value = [
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / gl.canvas.height,
    ];
  }

  private draw(): void {
    if (!this.renderer) return;
    this.program.uniforms.uTime.value = (performance.now() - this.t0) / 1000;
    this.cur[0] += 0.05 * (this.target[0] - this.cur[0]);
    this.cur[1] += 0.05 * (this.target[1] - this.cur[1]);
    const m = this.program.uniforms.uMouse.value as Float32Array;
    m[0] = this.cur[0];
    m[1] = this.cur[1];
    this.renderer.render({ scene: this.mesh });
  }

  private readonly tick = (): void => {
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  start(): void {
    if (this.running || !this.renderer) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  // Mode calm : une frame statique.
  renderStatic(): void {
    this.draw();
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) {
      this.renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.renderer.gl.canvas.remove();
      this.renderer = null;
    }
  }
}
