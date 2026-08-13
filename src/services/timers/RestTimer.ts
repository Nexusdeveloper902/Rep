type Listener = (remainingSec: number) => void;
type DoneListener = () => void;

/**
 * Rest timer countdown. Tracks an absolute end timestamp so backgrounded time is
 * accounted for on return. Notifies listeners every tick and at zero.
 */
export class RestTimer {
  private endAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private doneListeners = new Set<DoneListener>();

  start(durationSec: number): void {
    this.endAt = Date.now() + durationSec * 1000;
    this.tick();
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), 250);
  }

  private tick(): void {
    if (this.endAt == null) return;
    const remaining = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
    this.listeners.forEach((l) => l(remaining));
    if (remaining <= 0) {
      this.stop();
      this.doneListeners.forEach((l) => l());
    }
  }

  adjust(deltaSec: number): void {
    if (this.endAt == null) return;
    this.endAt += deltaSec * 1000;
    if (this.endAt < Date.now()) this.endAt = Date.now();
    this.tick();
  }

  skip(): void {
    this.stop();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.endAt = null;
  }

  get remainingSec(): number {
    if (this.endAt == null) return 0;
    return Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
  }

  get isRunning(): boolean {
    return this.endAt != null && this.endAt > Date.now();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.remainingSec);
    return () => this.listeners.delete(listener);
  }

  onDone(listener: DoneListener): () => void {
    this.doneListeners.add(listener);
    return () => this.doneListeners.delete(listener);
  }
}
