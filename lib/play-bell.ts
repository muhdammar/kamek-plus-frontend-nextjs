export function playBell() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);       // A5 — bell pitch
  oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1); // drop an octave

  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2); // fade out

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 2);
}
