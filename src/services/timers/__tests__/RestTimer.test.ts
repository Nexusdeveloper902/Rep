import { RestTimer } from '@/services/timers/RestTimer';

describe('RestTimer', () => {
  it('counts down and notifies at zero', (done) => {
    const t = new RestTimer();
    let reachedZero = false;
    t.onDone(() => {
      reachedZero = true;
      expect(reachedZero).toBe(true);
      done();
    });
    t.start(1); // 1 second
  });

  it('adjust shifts remaining time', () => {
    const t = new RestTimer();
    t.start(60);
    expect(t.remainingSec).toBeGreaterThan(58);
    t.adjust(30);
    expect(t.remainingSec).toBeGreaterThan(88);
    t.adjust(-60);
    expect(t.remainingSec).toBeLessThanOrEqual(60);
    t.skip();
    expect(t.isRunning).toBe(false);
  });
});
