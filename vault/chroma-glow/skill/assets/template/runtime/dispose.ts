// Chromatic glow: a runtime helper the template imports. FIXED.
export interface VisualEngine {
  readonly ok: boolean;
  start(): void;
  stop(): void;
  renderStill(): void;
  resize(): void;
  destroy(): void;
}

export const DPR_CAP = 2;
export function capDpr(cap: number = DPR_CAP): number {
  return Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, Math.min(cap, DPR_CAP));
}

export function watchContextLoss(canvas: HTMLCanvasElement, onLost: () => void): () => void {
  const lost = () => onLost();
  canvas.addEventListener('webglcontextlost', lost);
  return () => canvas.removeEventListener('webglcontextlost', lost);
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;
export type GlObjects = {
  programs?: (WebGLProgram | null | undefined)[];
  shaders?: (WebGLShader | null | undefined)[];
  buffers?: (WebGLBuffer | null | undefined)[];
  textures?: (WebGLTexture | null | undefined)[];
  framebuffers?: (WebGLFramebuffer | null | undefined)[];
  renderbuffers?: (WebGLRenderbuffer | null | undefined)[];
};

export function disposeGl(gl: GL | null | undefined, objects: GlObjects = {}): void {
  if (!gl) return;
  for (const p of objects.programs ?? []) if (p) gl.deleteProgram(p);
  for (const s of objects.shaders ?? []) if (s) gl.deleteShader(s);
  for (const b of objects.buffers ?? []) if (b) gl.deleteBuffer(b);
  for (const t of objects.textures ?? []) if (t) gl.deleteTexture(t);
  for (const f of objects.framebuffers ?? []) if (f) gl.deleteFramebuffer(f);
  for (const r of objects.renderbuffers ?? []) if (r) gl.deleteRenderbuffer(r);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}
