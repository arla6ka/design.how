import * as THREE from "three";
import { capDpr, watchContextLoss } from "./runtime/dispose";

export const RADIUS = 180;
export const PLANE_SIZE = 50;
export const AUTO_ROT_Y = 0.0005;
const AUTO_ROT_X = 0.0002;
const DRAG_EASE = 0.2;
export const HOVER_SCALE = 1.2;
const SCALE_EASE = 0.1;
const OPACITY_EASE = 0.12;
export const INERTIA_DECAY = 0.94;
const FLICK_SCALE = 0.9;

const CLICK_SLOP = 6;
const FOCUS_EASE = 0.14;
const FOCUS_DISTANCE = 300;
export const FOCUS_FILL = 0.62;
const BACKDROP_DIM = 0.16;

export interface ImageSphereOptions {
  distance?: number;
  fov?: number;
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PlaneMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

export class ImageSphere {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private planes: PlaneMesh[] = [];

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-2, -2);
  private hovered: PlaneMesh | null = null;
  private focused: PlaneMesh | null = null;

  private rotationX = 0;
  private rotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;
  private baseRotationX = 0;
  private baseRotationY = 0;

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private velX = 0;
  private velY = 0;
  private lastDX = 0;
  private lastDY = 0;

  private invQuat = new THREE.Quaternion();
  private worldPos = new THREE.Vector3();
  private homePos = new THREE.Vector3();
  private centerPos = new THREE.Vector3();
  private tmpPos = new THREE.Vector3();

  private raf = 0;
  private running = false;
  private disposed = false;

  private ro?: ResizeObserver;
  private cleanup: (() => void)[] = [];
  ok = true;

  constructor(host: HTMLElement, imageUrls: string[], opts: ImageSphereOptions = {}) {
    this.host = host;
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;

    const dpr = capDpr();
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(w, h);
    const canvas = this.renderer.domElement;
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      cursor: "grab",
      touchAction: "pan-y",
    });
    host.appendChild(canvas);
    this.cleanup.push(watchContextLoss(canvas, () => {
      this.stop();
      this.ok = false;
    }));

    this.camera = new THREE.PerspectiveCamera(opts.fov ?? 25, w / h, 0.1, 2000);
    this.camera.position.z = opts.distance ?? 520;
    this.scene.add(this.group);

    this.loadPlanes(imageUrls);
    this.bindEvents();
  }

  private loadPlanes(urls: string[]) {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const rand = seeded(7);
    urls.forEach((url) => {
      const phi = (rand() * 2 - 1) * Math.PI;
      const theta = rand() * Math.PI * 2;
      const r = RADIUS + (rand() - 0.5) * 80;
      loader.load(url, (tex) => {
        if (this.disposed) return;
        tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;

        const aspect = (tex.image.width || 1) / (tex.image.height || 1);
        const geo = new THREE.PlaneGeometry(PLANE_SIZE * aspect, PLANE_SIZE);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        mat.depthWrite = false;
        const plane = new THREE.Mesh(geo, mat) as PlaneMesh;
        plane.userData = { isHovered: false, opacity: 0, focus: 0, aspect };
        mat.opacity = 0;

        plane.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        );
        plane.userData.home = plane.position.clone();

        this.group.add(plane);
        this.planes.push(plane);
        if (!this.running && this.ok) this.renderStill();
      });
    });
  }

  private bindEvents() {
    const host = this.host;
    const localMouse = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      this.dragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      this.velX = this.velY = 0;
      this.lastDX = this.lastDY = 0;
      this.renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      localMouse(e.clientX, e.clientY);
      if (this.dragging) {
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        this.rotationY += dx * 1.0;
        this.rotationX -= dy * 1.0;
        this.lastDX = dx;
        this.lastDY = dy;
        this.startX = e.clientX;
        this.startY = e.clientY;
      }
    };
    const release = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.velY = this.lastDX * FLICK_SCALE;
      this.velX = -this.lastDY * FLICK_SCALE;
      this.renderer.domElement.style.cursor = "grab";
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      release();
      if (moved <= CLICK_SLOP && this.running) {
        this.velX = this.velY = 0;
        localMouse(e.clientX, e.clientY);
        const hit = this.pick();
        if (this.focused) this.focused = hit === this.focused ? null : hit;
        else this.focused = hit;
      }
    };
    const onLeave = () => {
      release();
      this.mouse.set(-2, -2);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.focused) this.focused = null;
    };
    window.addEventListener("keydown", onKey);
    this.cleanup.push(() => window.removeEventListener("keydown", onKey));

    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
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
  }

  private pick(): PlaneMesh | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.planes, false);
    return (hits.length > 0 ? hits[0].object : null) as PlaneMesh | null;
  }

  private hoverDetection() {
    const next = this.pick();
    if (next !== this.hovered) {
      if (this.hovered) this.hovered.userData.isHovered = false;
      this.hovered = next;
      if (this.hovered) this.hovered.userData.isHovered = true;
    }
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = () => {
    if (!this.running) return;

    if (!this.dragging && (this.velX !== 0 || this.velY !== 0)) {
      this.rotationY += this.velY;
      this.rotationX -= this.velX;
      this.velX *= INERTIA_DECAY;
      this.velY *= INERTIA_DECAY;
      if (Math.abs(this.velX) < 0.01) this.velX = 0;
      if (Math.abs(this.velY) < 0.01) this.velY = 0;
    }

    this.baseRotationY += AUTO_ROT_Y;
    this.baseRotationX += AUTO_ROT_X;
    this.currentRotationX += (this.rotationX - this.currentRotationX) * DRAG_EASE;
    this.currentRotationY += (this.rotationY - this.currentRotationY) * DRAG_EASE;
    this.group.rotation.x = this.baseRotationX + this.currentRotationX * 0.002;
    this.group.rotation.y = this.baseRotationY + this.currentRotationY * 0.002;

    if (!this.dragging && !this.focused) this.hoverDetection();
    else if (this.focused && this.hovered) {
      this.hovered.userData.isHovered = false;
      this.hovered = null;
    }
    const anyFocused = this.focused !== null;

    this.centerPos.set(0, 0, this.camera.position.z - FOCUS_DISTANCE);
    const viewH = 2 * FOCUS_DISTANCE * Math.tan((this.camera.fov * Math.PI) / 360);
    const focusScale = (viewH * FOCUS_FILL) / PLANE_SIZE;

    this.invQuat.copy(this.group.quaternion).invert();
    for (const plane of this.planes) {
      plane.quaternion.copy(this.invQuat);

      const focusTarget = plane === this.focused ? 1 : 0;
      const f = plane.userData.focus + (focusTarget - plane.userData.focus) * FOCUS_EASE;
      plane.userData.focus = f;

      if (f > 0.0005) {
        this.tmpPos.copy(this.centerPos);
        this.group.worldToLocal(this.tmpPos);
        plane.position.copy(plane.userData.home).lerp(this.tmpPos, f);
      } else if (plane.position.x !== plane.userData.home.x || plane.position.z !== plane.userData.home.z) {
        plane.position.copy(plane.userData.home);
      }

      plane.getWorldPosition(this.worldPos);
      const depth = this.worldPos.z;

      const zScale = 0.8 + depth / 2000;
      let target = plane.userData.isHovered ? zScale * HOVER_SCALE : zScale;
      target = target + (focusScale - target) * f;
      const s = plane.scale.x + (target - plane.scale.x) * SCALE_EASE;
      plane.scale.set(s, s, s);

      let wantOpacity = 1;
      if (anyFocused) wantOpacity = BACKDROP_DIM + (1 - BACKDROP_DIM) * f;
      const o = plane.userData.opacity + (wantOpacity - plane.userData.opacity) * OPACITY_EASE;
      plane.userData.opacity = o;
      plane.material.opacity = o;

      plane.renderOrder = f > 0.5 ? 1 : 0;
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  renderStill() {
    this.invQuat.copy(this.group.quaternion).invert();
    for (const plane of this.planes) {
      plane.quaternion.copy(this.invQuat);
      plane.getWorldPosition(this.worldPos);
      const zScale = 0.8 + this.worldPos.z / 2000;
      plane.scale.set(zScale, zScale, zScale);
      plane.userData.opacity = 1;
      plane.material.opacity = 1;
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.cleanup.forEach((fn) => fn());
    this.ro?.disconnect();
    for (const plane of this.planes) {
      plane.geometry.dispose();
      const mat = plane.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.dispose();
    }
    this.planes = [];
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    const canvas = this.renderer.domElement;
    canvas.parentNode?.removeChild(canvas);
  }
}
