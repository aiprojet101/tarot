let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function isEnabled(): boolean {
  return localStorage.getItem("tarot_audio") !== "false";
}

function isTurnAlertEnabled(): boolean {
  return localStorage.getItem("tarot_turn_alert") !== "false";
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.05) {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playCardSound() {
  playNoise(0.08, 0.06);
  playTone(800, 0.05, "sine", 0.03);
}

export function playPassSound() {
  playTone(300, 0.08, "sine", 0.08);
}

export function playDealSound(numCards: number = 6, durationMs: number = 800) {
  if (!isEnabled()) return;
  const interval = durationMs / numCards;
  for (let i = 0; i < numCards; i++) {
    setTimeout(() => {
      playNoise(0.06, 0.04);
      playTone(600 + i * 30, 0.04, "sine", 0.02);
    }, i * interval);
  }
}

export function playWinSound() {
  if (!isEnabled()) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.12), i * 150);
  });
}

export function playLoseSound() {
  if (!isEnabled()) return;
  const notes = [400, 350, 300, 250];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.1), i * 200);
  });
}

export function playRoundEndSound() {
  playTone(600, 0.15, "sine", 0.1);
  setTimeout(() => playTone(800, 0.2, "sine", 0.1), 100);
}

export function playTurnAlertSound() {
  if (!isTurnAlertEnabled()) return;
  playTone(880, 0.1, "sine", 0.1);
  setTimeout(() => playTone(1100, 0.15, "sine", 0.1), 120);
}

export function playTrumpSound() {
  if (!isEnabled()) return;
  playTone(440, 0.1, "triangle", 0.1);
  setTimeout(() => playTone(660, 0.1, "triangle", 0.1), 80);
  setTimeout(() => playTone(880, 0.2, "triangle", 0.12), 160);
}
