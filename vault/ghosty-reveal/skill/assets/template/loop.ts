// Ghosty reveal (https://design.how/vault/ghosty-reveal), loop.ts.
// FIXED. Change the VARIABLE values in params instead (IMAGES, SLOTS, MASK_SCALE, DURATION, HOLD, EASING, DIRECTION).
const SWAP_BUFFER = 220;
const BEAT = 140;

export class GhostLoop {
  private timer = 0;
  private running = false;
  private shown = false;

  constructor(
    private readonly timing: () => {duration: number; hold: number},
    private readonly onShow: (shown: boolean) => void,
    private readonly onNext: () => void,
    private readonly delay = 0,
    shown = false,
  ) {
    this.shown = shown;
  }

  start() {
    if (this.running) return;
    this.running = true;
    if (this.shown) this.at(() => this.out(), this.timing().hold + this.delay);
    else this.at(() => this.leg(), this.delay);
  }

  stop() {
    this.running = false;
    window.clearTimeout(this.timer);
  }

  destroy() {
    this.stop();
  }

  private at(fn: () => void, ms: number) {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => { if (this.running) fn(); }, ms);
  }

  private set(shown: boolean) {
    this.shown = shown;
    this.onShow(shown);
  }

  private leg() {
    const {duration, hold} = this.timing();
    this.at(() => {
      this.set(true);
      this.at(() => this.out(), duration + hold);
    }, BEAT);
  }

  private out() {
    this.set(false);
    this.at(() => {
      this.onNext();
      this.leg();
    }, this.timing().duration + SWAP_BUFFER);
  }
}
