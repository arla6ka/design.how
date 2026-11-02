import * as THREE from "three";
import { SANDBOX_VERT, SANDBOX_FRAG } from "./shaders";
import { glyphCanvas } from "./glyphs";
import { capDpr } from "./runtime/dispose";

export interface SandboxParams {
  cell: number;
  bandColors: string[];
  bandStops: number[];
  bandGlyphs: number[];
  zoom?: number;
  bg?: string;
}

export class SandboxRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private uniforms: Record<string, { value: unknown }>;
  private canvas: HTMLCanvasElement;

  private srcAspect = 1;
  private video: HTMLVideoElement | null = null;
  private videoTex: THREE.VideoTexture | null = null;
  private raf = 0;
  private playing = false;

  private pool = new Map<
    string,
    { video: HTMLVideoElement; tex: THREE.VideoTexture; aspect: number; ready: boolean }
  >();
  private curUrl: string | null = null;
  private pendingSwap = false;

  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  private glyphIdx: number[];
  private reqCell: number;
  private morphRaf = 0;
  onCommit?: () => void;

  constructor(canvas: HTMLCanvasElement, params: SandboxParams) {
    this.glyphIdx = [...params.bandGlyphs];
    this.reqCell = params.cell;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(capDpr());
    this.renderer.setClearColor(new THREE.Color(params.bg ?? "#ffffff"), 1);

    const placeholder = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 4;
      const x = c.getContext("2d")!;
      x.fillStyle = "#9a9a9a";
      x.fillRect(0, 0, 4, 4);
      return new THREE.CanvasTexture(c);
    })();

    const glyphTex = params.bandGlyphs.map((g) => this.makeGlyph(g));

    const colA = params.bandColors.map((h) => new THREE.Color(h));
    this.uniforms = {
      src: { value: placeholder },
      resolution: { value: new THREE.Vector2(1, 1) },
      srcScale: { value: new THREE.Vector2(1, 1) },
      zoom: { value: params.zoom ?? 1 },
      bgColor: { value: new THREE.Color(params.bg ?? "#ffffff") },
      cell: { value: params.cell },
      bandColor: { value: colA },
      bandColorB: { value: colA.map((c) => c.clone()) },
      bandLo: { value: [params.bandStops[0], params.bandStops[1], params.bandStops[2], params.bandStops[3]] },
      bandHi: { value: [params.bandStops[1], params.bandStops[2], params.bandStops[3], params.bandStops[4]] },
      glyph: { value: glyphTex },
      glyphB: { value: glyphTex.map((_, i) => this.makeGlyph(params.bandGlyphs[i])) },
      morphT: { value: 1 },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: SANDBOX_VERT,
      fragmentShader: SANDBOX_FRAG,
      uniforms: this.uniforms,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    this.scene.add(this.quad);

    this.resize();
    this.render();
  }

  private makeGlyph(i: number): THREE.CanvasTexture {
    const t = new THREE.CanvasTexture(glyphCanvas(i));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  private disposed = false;

  render = () => {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  };

  resize = () => {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    this.renderer.setSize(w, h, false);
    (this.uniforms.resolution.value as THREE.Vector2).set(w, h);
    this.applyCell();
    this.fit();
    this.render();
  };

  private applyCell() {
    const REF = 600;
    const w = Math.max(1, this.canvas.getBoundingClientRect().width);
    const eff = Math.max(2, this.reqCell * (w / REF));
    this.uniforms.cell.value = eff;
  }

  private fit() {
    this.quad.scale.set(1, 1, 1);
    const rect = this.canvas.getBoundingClientRect();
    const ca = rect.width / Math.max(1, rect.height);
    let ux = 1;
    let uy = 1;
    if (this.srcAspect > ca) ux = ca / this.srcAspect;
    else uy = this.srcAspect / ca;
    (this.uniforms.srcScale.value as THREE.Vector2).set(ux, uy);
  }

  private morphing() {
    return (this.uniforms.morphT.value as number) < 1;
  }

  setCellStops(cell: number, stops: number[]) {
    this.reqCell = cell;
    this.applyCell();
    this.uniforms.bandLo.value = [stops[0], stops[1], stops[2], stops[3]];
    this.uniforms.bandHi.value = [stops[1], stops[2], stops[3], stops[4]];
    this.render();
  }

  setZoom(zoom: number) {
    if (this.pendingSwap) return;
    this.uniforms.zoom.value = zoom;
    this.render();
  }

  private commitZoom(zoom: number) {
    this.uniforms.zoom.value = zoom;
  }

  setBg(hex: string) {
    (this.uniforms.bgColor.value as THREE.Color).set(hex);
    this.renderer.setClearColor(hex, 1);
    this.render();
  }

  setColors(colors: string[]) {
    if (this.morphing() || this.pendingSwap) return;
    (this.uniforms.bandColor.value as THREE.Color[]).forEach((c, i) => c.set(colors[i]));
    (this.uniforms.bandColorB.value as THREE.Color[]).forEach((c, i) => c.set(colors[i]));
    this.uniforms.morphT.value = 1;
    this.render();
  }

  setLook(colors: string[], glyphs: number[]) {
    cancelAnimationFrame(this.morphRaf);
    const a = this.uniforms.glyph.value as THREE.CanvasTexture[];
    const b = this.uniforms.glyphB.value as THREE.CanvasTexture[];
    const colA = this.uniforms.bandColor.value as THREE.Color[];
    const colB = this.uniforms.bandColorB.value as THREE.Color[];
    for (let i = 0; i < 4; i++) {
      a[i].dispose();
      b[i].dispose();
      a[i] = this.makeGlyph(glyphs[i]);
      b[i] = this.makeGlyph(glyphs[i]);
      colA[i].set(colors[i]);
      colB[i].set(colors[i]);
    }
    this.glyphIdx = [...glyphs];
    this.uniforms.morphT.value = 1;
    this.render();
  }

  setGlyph(band: number, glyphIndex: number) {
    this.glyphIdx[band] = glyphIndex;
    const a = this.uniforms.glyph.value as THREE.CanvasTexture[];
    const b = this.uniforms.glyphB.value as THREE.CanvasTexture[];
    a[band].dispose();
    b[band].dispose();
    a[band] = this.makeGlyph(glyphIndex);
    b[band] = this.makeGlyph(glyphIndex);
    this.render();
  }

  morphTo(colors: string[], glyphs: number[], ms = 700) {
    cancelAnimationFrame(this.morphRaf);
    const a = this.uniforms.glyph.value as THREE.CanvasTexture[];
    const b = this.uniforms.glyphB.value as THREE.CanvasTexture[];
    const colA = this.uniforms.bandColor.value as THREE.Color[];
    const colB = this.uniforms.bandColorB.value as THREE.Color[];

    for (let i = 0; i < 4; i++) {
      b[i].dispose();
      b[i] = this.makeGlyph(this.glyphIdx[i]);
      colB[i].copy(colA[i]);
      a[i].dispose();
      a[i] = this.makeGlyph(glyphs[i]);
      colA[i].set(colors[i]);
    }
    this.glyphIdx = [...glyphs];

    const springOut = (t: number) =>
      t >= 1 ? 1 : 1 - Math.exp(-7.5 * t) * Math.cos(5.2 * t);

    const t0 = performance.now();
    const step = () => {
      const x = Math.min(1, (performance.now() - t0) / ms);
      this.uniforms.morphT.value = springOut(x);
      this.render();
      if (x < 1) this.morphRaf = requestAnimationFrame(step);
      else this.uniforms.morphT.value = 1;
    };
    this.uniforms.morphT.value = 0;
    this.morphRaf = requestAnimationFrame(step);
  }

  private ensurePooled(url: string) {
    if (this.pool.has(url)) return this.pool.get(url)!;
    const v = document.createElement("video");
    v.src = url.startsWith("blob:") ? url : encodeURI(url);
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const entry = { video: v, tex, aspect: 1, ready: false };
    v.addEventListener("loadeddata", () => {
      entry.aspect = v.videoWidth / v.videoHeight || 1;
      entry.ready = true;
    });
    v.load();
    this.pool.set(url, entry);
    return entry;
  }

  preload(urls: string[]) {
    for (const u of urls) this.ensurePooled(u);
  }

  setImage(url: string, look?: { colors: string[]; glyphs: number[]; zoom?: number }) {
    this.curUrl = url;
    if (look) this.pendingSwap = true;
    const src = url.startsWith("blob:") ? url : encodeURI(url);
    new THREE.TextureLoader().load(src, (tex) => {
      if (this.curUrl !== url) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      this.pendingSwap = false;
      if (look) {
        this.setLook(look.colors, look.glyphs);
        if (look.zoom !== undefined) this.commitZoom(look.zoom);
      }
      if (this.video) this.video.pause();
      this.stopLoop();
      this.uniforms.src.value = tex;
      this.srcAspect = tex.image.width / tex.image.height;
      this.video = null;
      this.videoTex = null;
      this.fit();
      this.render();
    });
  }

  setVideo(url: string, look?: { colors: string[]; glyphs: number[]; zoom?: number }) {
    this.curUrl = url;
    if (look) this.pendingSwap = true;
    const entry = this.ensurePooled(url);

    const HOLD_MS = 100;

    const commit = () => {
      if (this.curUrl !== url) return;
      if (this.video && this.video !== entry.video) this.video.pause();
      this.pendingSwap = false;
      if (look) {
        this.setLook(look.colors, look.glyphs);
        if (look.zoom !== undefined) this.commitZoom(look.zoom);
      }
      this.uniforms.src.value = entry.tex;
      this.video = entry.video;
      this.videoTex = entry.tex;
      this.srcAspect = entry.aspect;
      this.fit();
      this.startLoop();
      this.render();
      this.onCommit?.();
    };

    const beginHold = () => {
      if (this.curUrl !== url) return;
      const t0 = performance.now();
      const onFrame = () => {
        if (this.curUrl !== url) return;
        const wait = Math.max(0, HOLD_MS - (performance.now() - t0));
        window.setTimeout(commit, wait);
      };
      const v = entry.video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      };
      if (typeof v.requestVideoFrameCallback === "function") {
        v.requestVideoFrameCallback(onFrame);
      } else {
        window.setTimeout(commit, HOLD_MS);
      }
      this.startLoop();
    };

    entry.video.play().then(beginHold).catch(() => {
      commit();
    });
  }

  showFrame(url: string, look: { colors: string[]; glyphs: number[]; zoom?: number }, at = 0.5) {
    this.curUrl = url;
    const entry = this.ensurePooled(url);
    const v = entry.video;
    const commit = () => {
      if (this.curUrl !== url) return;
      this.setLook(look.colors, look.glyphs);
      if (look.zoom !== undefined) this.commitZoom(look.zoom);
      entry.tex.needsUpdate = true;
      this.uniforms.src.value = entry.tex;
      this.video = v;
      this.videoTex = entry.tex;
      this.srcAspect = v.videoWidth / v.videoHeight || 1;
      this.fit();
      this.render();
    };
    const seek = () => {
      v.addEventListener("seeked", commit, { once: true });
      v.currentTime = Math.min(at, (v.duration || at) * 0.5);
    };
    if (v.readyState >= 2) seek();
    else v.addEventListener("loadeddata", seek, { once: true });
  }

  pause() {
    this.video?.pause();
    this.stopLoop();
  }

  resume() {
    if (!this.video) return;
    this.video.play().catch(() => {});
    this.startLoop();
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  hasVideo() {
    return !!this.video;
  }

  playPause(): boolean {
    if (!this.video) return false;
    if (this.video.paused) {
      this.video.play();
      this.startLoop();
    } else {
      this.video.pause();
      this.stopLoop();
      this.render();
    }
    return !this.video.paused;
  }

  private loop = () => {
    if (!this.playing) return;
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };
  private startLoop() {
    if (this.playing || this.disposed) return;
    this.playing = true;
    this.raf = requestAnimationFrame(this.loop);
  }
  private stopLoop() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }

  private download(blob: Blob, name: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  exportPNG() {
    this.render();
    this.canvas.toBlob((blob) => {
      if (blob) this.download(blob, `sandbox-${Date.now()}.png`);
    }, "image/png");
  }

  toggleRecord(): boolean {
    if (this.recorder && this.recorder.state === "recording") {
      this.recorder.stop();
      this.recorder = null;
      return false;
    }
    const stream = this.canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 8_000_000,
    });
    this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.recorder.onstop = () =>
      this.download(new Blob(this.chunks, { type: "video/webm" }), `sandbox-${Date.now()}.webm`);
    this.recorder.start();
    if (!this.playing) this.startLoop();
    return true;
  }

  dispose() {
    this.disposed = true;
    this.curUrl = null;
    this.stopLoop();
    cancelAnimationFrame(this.morphRaf);
    if (this.recorder && this.recorder.state === "recording") this.recorder.stop();
    for (const { video, tex } of this.pool.values()) {
      video.pause();
      video.src = "";
      video.load();
      tex.dispose();
    }
    this.pool.clear();
    this.video = null;
    this.videoTex = null;
    (this.uniforms.glyph.value as THREE.CanvasTexture[]).forEach((t) => t.dispose());
    (this.uniforms.glyphB.value as THREE.CanvasTexture[]).forEach((t) => t.dispose());
    (this.quad.material as THREE.ShaderMaterial).dispose();
    this.quad.geometry.dispose();
    (this.uniforms.src.value as THREE.Texture | null)?.dispose?.();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
