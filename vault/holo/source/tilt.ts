import { FOILS, Follow, Kick, Orientation, applyFoil, applyFrame, fromPointer, type Foil } from "./engine";

export class HoloTilt {
  private readonly tilt = new Follow(0.16);
  private readonly sheet = new Follow(0.09);
  private readonly kick = new Kick();
  private readonly orient = new Orientation();
  private readonly t0 = performance.now();
  private raf = 0;
  private running = false;
  private idle = 0;
  private touched = false;
  private release = 1;
  private handoff = { x: 0, y: 0 };
  private grab = 1;
  private grabFrom = { x: 0, y: 0 };
  private aim = { x: 0, y: 0 };

  constructor(private readonly host: HTMLElement, private readonly card: HTMLElement, private readonly foil: Foil = FOILS[0]) {
    applyFoil(card, foil);
    host.addEventListener("pointermove", this.onPointer);
    host.addEventListener("pointerleave", this.onLeave);
    window.addEventListener("deviceorientation", this.onOrient);
  }

  start() {
    this.running = true;
    this.wake();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.stop();
    applyFrame(this.card, { x: 0, y: 0 }, { x: 0, y: 0 }, this.foil, this.foil, { speed: 0, velocity: { x: 0, y: 0 }, time: 0 });
  }

  destroy() {
    this.stop();
    this.host.removeEventListener("pointermove", this.onPointer);
    this.host.removeEventListener("pointerleave", this.onLeave);
    window.removeEventListener("deviceorientation", this.onOrient);
  }

  private wake() {
    if (this.running && !this.raf) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = () => {
    this.raf = 0;
    const { tilt, sheet, kick } = this;
    if (!this.touched) {
      this.idle += 0.0042;
      const drift = { x: Math.sin(this.idle) * 0.28, y: Math.cos(this.idle * 0.73) * 0.2 };
      this.release = Math.min(1, this.release + 0.016);
      const k = this.release * this.release;
      tilt.target = { x: this.handoff.x + (drift.x - this.handoff.x) * k, y: this.handoff.y + (drift.y - this.handoff.y) * k };
    } else {
      this.grab = Math.min(1, this.grab + 0.018);
      const k = this.grab * this.grab;
      tilt.target = { x: this.grabFrom.x + (this.aim.x - this.grabFrom.x) * k, y: this.grabFrom.y + (this.aim.y - this.grabFrom.y) * k };
    }
    const kk = kick.step();
    if (kk.x || kk.y) tilt.target = { x: tilt.target.x + kk.x, y: tilt.target.y + kk.y };
    tilt.step();
    sheet.target = tilt.value;
    sheet.step();
    applyFrame(this.card, tilt.value, sheet.value, this.foil, this.foil, { speed: sheet.speed, velocity: sheet.velocity, time: (performance.now() - this.t0) / 1000 });
    if (this.running && (!this.touched || this.release < 1 || this.grab < 1 || kick.active || !tilt.settled || !sheet.settled)) this.raf = requestAnimationFrame(this.frame);
  };

  private onPointer = (e: PointerEvent) => {
    this.aim = fromPointer(this.host.getBoundingClientRect(), e.clientX, e.clientY);
    if (!this.touched) {
      this.touched = true;
      this.grabFrom = { ...this.tilt.value };
      this.grab = 0;
    }
    this.release = 0;
    this.wake();
  };

  private onLeave = () => {
    this.touched = false;
    this.handoff = { ...this.tilt.value };
    this.release = 0;
    this.grab = 1;
    this.kick.fire(this.tilt.velocity);
    this.wake();
  };

  private onOrient = (e: DeviceOrientationEvent) => {
    const v = this.orient.read(e);
    if (!v) return;
    this.touched = true;
    this.tilt.target = v;
    this.wake();
  };
}
