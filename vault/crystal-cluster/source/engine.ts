import * as THREE from "three";
import { capDpr, watchContextLoss } from "./runtime/dispose";

export const MAGNET_EASE = 0.05;
export const PULL = 0.4;
export const OUTLINE_PX = 4;
export const OUTLINE_COLOR = "#ffef7a";
export const BEAM_CORE = "#ffe63a";
export const BEAM_GOLD = "#ffd21e";
export const RELIC_SCALE = 1.3;
export const CRYSTAL_COLOR = "#2fb6a8";

export class CrystalCluster {
  ok = true;
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;

  private pivot = new THREE.Group();
  private model: THREE.Group | null = null;
  private unwatch: (() => void) | null = null;
  private aura?: THREE.Mesh;
  private backGlow?: THREE.Mesh;
  private outlineMats: THREE.ShaderMaterial[] = [];
  private baseY = 0;

  private restX = 0;
  private restY = 0;
  private curX = 0;
  private curY = 0;
  private pointer = { x: 0, y: 0, inside: false };
  private smoothPointerX = 0;

  private hoverInt = 0;

  private raf = 0;
  private running = false;
  private disposed = false;
  private clock = new THREE.Clock();

  private ro?: ResizeObserver;
  private cleanup: (() => void)[] = [];

  constructor(host: HTMLElement) {
    this.host = host;
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    const dpr = capDpr();
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    const canvas = this.renderer.domElement;
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "pan-y",
    });
    host.appendChild(canvas);
    this.unwatch = watchContextLoss(canvas, () => {
      this.stop();
      this.ok = false;
    });

    this.camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 6);

    this.scene.add(this.pivot);
    this.addLights();
    this.addBackGlow();
    this.addBeam();
    this.buildRelic();
    this.bindEvents();
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xfff4d8, 4.0);
    key.position.set(2, 3, 5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 2.4);
    fill.position.set(0, 0, 6);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe9a8, 1.6);
    rim.position.set(-3, 1, -2);
    this.scene.add(rim);
  }

  private addBackGlow() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,215,40,0.95)");
    g.addColorStop(0.22, "rgba(255,200,25,0.55)");
    g.addColorStop(0.5, "rgba(255,190,20,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(2.4, 1.2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
    });
    const glow = new THREE.Mesh(geo, mat);
    glow.position.set(0.1, 0.0, -0.5);
    this.backGlow = glow;
    this.scene.add(glow);
  }

  private addBeam() {
    const geo = new THREE.PlaneGeometry(4.5, 6, 1, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uPointer: { value: 0 },
        uCore: { value: new THREE.Color(BEAM_CORE) },
        uGold: { value: new THREE.Color(BEAM_GOLD) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv; // (0,0) bottom-left → (1,1) top-right
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uIntensity;
        uniform float uPointer; // -1..1 pointer x (very weak lean), 0 when away
        uniform vec3 uCore;
        uniform vec3 uGold;
        varying vec2 vUv;

        // cheap value-noise for the living flicker
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          f = f*f*(3.0-2.0*f);
          float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
          return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
        }

        void main() {
          float t = uTime;
          float y = vUv.y;            // 0 at relic (bottom) → 1 at top

          // the beam sways side to side + leans toward the pointer; the sway grows
          // with height so the top drifts more (feels alive). A little stronger now.
          float sway = sin(t * 0.7 + y * 2.0) * 0.035 * y
                     + sin(t * 1.7 + y * 5.0) * 0.012 * y; // second finer wobble
          float x = (vUv.x - 0.5) - sway - uPointer * 0.025 * y; // −0.5..0.5, animated

          // vertical envelope: fade IN fast just above the relic, fade OUT toward top.
          float base = smoothstep(0.0, 0.06, y);       // rise from the relic
          float top  = 1.0 - smoothstep(0.55, 1.0, y);  // fade to nothing near top
          float vert = base * top;

          // Narrower beam. A soft envelope holds the columns together as one shaft.
          float widen = 1.0 + y * 0.30;
          float envelope = smoothstep(0.20 * widen, 0.0, abs(x)) * 0.4;

          // 5 soft vertical columns L→R with graded weights: col1 weak, col2 strong,
          // col3 strongest, col4 & col5 weak. Each is a SMOOTH gaussian so they
          // overlap cleanly — no hard bands, no clipping.
          float cols = 0.0;
          cols += 0.30 * exp(-pow((x + 0.12) / (0.030 * widen), 2.0)); // 1 weak
          cols += 0.75 * exp(-pow((x + 0.05) / (0.032 * widen), 2.0)); // 2 strong
          cols += 1.00 * exp(-pow((x - 0.01) / (0.034 * widen), 2.0)); // 3 strongest
          cols += 0.30 * exp(-pow((x - 0.08) / (0.030 * widen), 2.0)); // 4 weak
          cols += 0.30 * exp(-pow((x - 0.15) / (0.028 * widen), 2.0)); // 5 weak

          // living flicker: soft flowing noise scrolling up + a slow global pulse,
          // so the beam breathes and shimmers instead of sitting static.
          float flow = noise(vec2(x * 6.0, y * 5.0 - t * 1.1));
          float flicker = 0.74 + 0.26 * flow;
          float pulse = 0.9 + 0.1 * sin(t * 1.3);

          // rising energy: two soft bright bands drift UP the beam (loot-beam feel).
          // fract() loops them; the sine makes each a soft blob, not a hard line.
          float r1 = sin((fract(y - t * 0.28) ) * 3.14159);
          float r2 = sin((fract(y - t * 0.16 + 0.5)) * 3.14159);
          float risers = (pow(max(r1,0.0), 6.0) + pow(max(r2,0.0), 6.0) * 0.7) * 0.35;

          float core = cols;                 // the columns are the bright part
          float beam = (cols + envelope) * vert * flicker * pulse;
          beam += risers * cols * vert; // riser bands ride the columns, within the beam

          // glow pool at the base, behind the relic (radial, only near y≈0)
          float pool = smoothstep(0.30, 0.0, length(vec2(x * 1.6, y - 0.02))) * (1.0 - smoothstep(0.0, 0.28, y));
          beam += pool * 0.5;

          beam *= uIntensity * 0.6;

          // pure golden yellow, slightly hotter in the center (no white)
          vec3 col = mix(uGold, uCore, clamp(core, 0.0, 1.0));
          float a = clamp(beam, 0.0, 1.0);
          gl_FragColor = vec4(col * beam, a);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
    });
    this.aura = new THREE.Mesh(geo, mat);
    this.aura.position.set(0.1, 3.0, -1.5);
    this.aura.renderOrder = 0;
    this.scene.add(this.aura);
  }

  private buildRelic() {
    const model = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CRYSTAL_COLOR),
      roughness: 0.35,
      metalness: 0.15,
      flatShading: true,
      emissive: new THREE.Color("#0b3b37"),
    });
    const parts: { scale: [number, number, number]; pos: [number, number, number]; rot: [number, number, number] }[] = [
      { scale: [0.36, 0.62, 0.36], pos: [0, 0.02, 0], rot: [0, 0.4, 0] },
      { scale: [0.2, 0.38, 0.2], pos: [-0.36, -0.12, 0.06], rot: [0, 0.9, 0.5] },
      { scale: [0.17, 0.3, 0.17], pos: [0.33, -0.16, -0.04], rot: [0.1, 0.2, -0.55] },
    ];
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    for (const part of parts) {
      const geo = new THREE.OctahedronGeometry(1, 0);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(...part.scale);
      mesh.position.set(...part.pos);
      mesh.rotation.set(...part.rot);
      const outlineMat = this.makeOutlineMaterial(size);
      const outline = new THREE.Mesh(geo, outlineMat);
      outline.renderOrder = -1;
      mesh.add(outline);
      this.outlineMats.push(outlineMat);
      model.add(mesh);
    }
    model.scale.setScalar(RELIC_SCALE);
    this.pivot.add(model);
    this.model = model;
    this.pivot.position.set(0.1, 0.02, 0);
    this.baseY = this.pivot.position.y;
    this.restY = this.curY = 0.5;
    this.restX = this.curX = 0.12;
    this.pivot.rotation.set(this.curX, this.curY, 0);
  }

  private makeOutlineMaterial(size: THREE.Vector2): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(OUTLINE_COLOR) },
        uThickness: { value: OUTLINE_PX },
        uSize: { value: size.clone() },
      },
      vertexShader: `
        #include <common>
        uniform float uThickness;
        uniform vec2 uSize;
        void main() {
          #include <beginnormal_vertex>
          #include <begin_vertex>
          #include <project_vertex>
          // project_vertex sets gl_Position from the transformed position.
          vec4 clipN = projectionMatrix * modelViewMatrix * vec4(objectNormal, 0.0);
          vec2 offset = normalize(clipN.xy) * uThickness / uSize * gl_Position.w * 2.0;
          gl_Position.xy += offset;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        void main() { gl_FragColor = vec4(uColor, 1.0); }`,
      side: THREE.BackSide,
    });
  }

  private bindEvents() {
    const host = this.host;
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.pointer.inside = true;
    };
    const onLeave = () => {
      this.pointer.inside = false;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
  }

  resize() {
    if (this.disposed) return;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    for (const m of this.outlineMats) m.uniforms.uSize.value.copy(size);
  }

  start() {
    if (this.running || this.disposed || !this.ok) return;
    this.running = true;
    this.clock.getDelta();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = () => {
    if (!this.running) return;
    const t = this.clock.getElapsedTime();

    const leanY = this.pointer.inside ? this.pointer.x * PULL : 0;
    const leanX = this.pointer.inside ? -this.pointer.y * PULL * 0.6 : 0;
    this.curY += (this.restY + leanY - this.curY) * MAGNET_EASE;
    this.curX += (this.restX + leanX - this.curX) * MAGNET_EASE;
    this.pivot.rotation.x = this.curX;
    this.pivot.rotation.y = this.curY;
    this.pivot.position.y = this.baseY + Math.sin(t * 0.9) * 0.022;

    let want = 0;
    if (this.pointer.inside) {
      const dist = Math.hypot(this.pointer.x, this.pointer.y);
      want = Math.max(0.25, 1 - dist * 0.7);
    }
    this.hoverInt += (want - this.hoverInt) * 0.05;

    const pTargetX = this.pointer.inside ? this.pointer.x : 0;
    this.smoothPointerX += (pTargetX - this.smoothPointerX) * 0.07;

    if (this.aura) {
      const u = (this.aura.material as THREE.ShaderMaterial).uniforms;
      u.uTime.value = t;
      u.uIntensity.value = 1.0 + this.hoverInt * 0.35 + Math.sin(t * 0.8) * 0.05;
      u.uPointer.value = this.smoothPointerX;
    }

    if (this.backGlow) {
      const m = this.backGlow.material as THREE.MeshBasicMaterial;
      m.opacity = 0.5 + Math.sin(t * 1.1) * 0.05 + this.hoverInt * 0.14;
      const breathe = 1.0 + Math.sin(t * 0.9) * 0.02;
      const sx = breathe + this.smoothPointerX * 0.06;
      const sy = breathe - this.smoothPointerX * 0.04;
      this.backGlow.scale.set(sx, sy, 1);
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  renderStill() {
    if (!this.ok) return;
    if (this.aura) (this.aura.material as THREE.ShaderMaterial).uniforms.uTime.value = 1.2;
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.cleanup.forEach((fn) => fn());
    this.ro?.disconnect();
    this.unwatch?.();
    this.unwatch = null;
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose?.();
        const m = mesh.material as THREE.Material | THREE.Material[];
        Array.isArray(m) ? m.forEach((x) => x.dispose()) : m?.dispose?.();
      }
    });
    (this.backGlow?.material as THREE.MeshBasicMaterial | undefined)?.map?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    const canvas = this.renderer.domElement;
    canvas.parentNode?.removeChild(canvas);
  }
}
