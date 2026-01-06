export type BoothPreset = "NORMAL" | "ECHO" | "ROOM" | "STAGE";

export type AudioHandlerOptions = {
  headphoneFirst?: boolean;
  latencyHint?: AudioContextLatencyCategory | number;
  forceSampleRate?: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export class AudioHandler {
  private opts: Required<Omit<AudioHandlerOptions, "forceSampleRate">> & {
    forceSampleRate?: number;
  };

  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private src: MediaStreamAudioSourceNode | null = null;

  private hp: BiquadFilterNode | null = null;
  private presence: BiquadFilterNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private outGain: GainNode | null = null;

  private echoDelay: DelayNode | null = null;
  private echoFb: GainNode | null = null;
  private echoMix: GainNode | null = null;

  private roomDelay: DelayNode | null = null;
  private roomMix: GainNode | null = null;

  private muted = false;
  private lastVolume = 1.05;

  constructor(options: AudioHandlerOptions = {}) {
    this.opts = {
      headphoneFirst: options.headphoneFirst ?? true,
      latencyHint: options.latencyHint ?? 0.01,
      forceSampleRate: options.forceSampleRate,
    };
  }

  get isRunning() {
    return !!this.ctx && !!this.stream;
  }

  getLatencyEstimate() {
    if (!this.ctx) return null;
    const anyCtx = this.ctx;
    return {
      sampleRate: this.ctx.sampleRate,
      baseLatency: this.ctx.baseLatency ?? null,
      outputLatency: anyCtx.outputLatency ?? null,
    };
  }

  async startMic(): Promise<void> {
    if (this.isRunning) return;

    const audioConstraints = this.opts.headphoneFirst
      ? {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,

          // Chrome hints (ignored elsewhere)
          googEchoCancellation: false,
          googNoiseSuppression: false,
          googAutoGainControl: false,
          googHighpassFilter: false,
        }
      : {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: false,
    });

    const AudioCtxCtor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;

    this.ctx = new AudioCtxCtor({
      latencyHint: this.opts.latencyHint,
      sampleRate: this.opts.forceSampleRate,
    });
    await this.ctx.resume();

    this.src = this.ctx.createMediaStreamSource(this.stream);

    // Light EQ (cheap)
    this.hp = this.ctx.createBiquadFilter();
    this.hp.type = "highpass";
    this.hp.frequency.value = 85;

    this.presence = this.ctx.createBiquadFilter();
    this.presence.type = "peaking";
    this.presence.frequency.value = 2800;
    this.presence.Q.value = 0.9;
    this.presence.gain.value = 2.5;

    // Gentle compressor (avoid heavy lookahead feel)
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -24;
    this.comp.knee.value = 12;
    this.comp.ratio.value = 3;
    this.comp.attack.value = 0.003;
    this.comp.release.value = 0.18;

    // Output (monitor)
    this.outGain = this.ctx.createGain();
    this.outGain.gain.value = this.lastVolume;

    // Echo (slapback)
    this.echoDelay = this.ctx.createDelay(1.0);
    this.echoDelay.delayTime.value = 0.14;
    this.echoFb = this.ctx.createGain();
    this.echoFb.gain.value = 0.22;
    this.echoMix = this.ctx.createGain();
    this.echoMix.gain.value = 0.0;

    this.echoDelay.connect(this.echoFb);
    this.echoFb.connect(this.echoDelay);

    // Room "air" (tiny early reflection)
    this.roomDelay = this.ctx.createDelay(0.2);
    this.roomDelay.delayTime.value = 0.02;
    this.roomMix = this.ctx.createGain();
    this.roomMix.gain.value = 0.0;

    // Wire dry chain first
    this.src.connect(this.hp);
    this.hp.connect(this.presence);
    this.presence.connect(this.comp);
    this.comp.connect(this.outGain);
    this.outGain.connect(this.ctx.destination);

    // Sends
    this.outGain.connect(this.echoMix);
    this.echoMix.connect(this.echoDelay);
    this.echoDelay.connect(this.ctx.destination);

    this.outGain.connect(this.roomMix);
    this.roomMix.connect(this.roomDelay);
    this.roomDelay.connect(this.ctx.destination);

    this.muted = false;
    this.setPreset("ECHO");
  }

  setHeadphoneFirst(on: boolean) {
    this.opts.headphoneFirst = on;
  }

  setVolume(v: number) {
    if (!this.outGain) return;
    this.lastVolume = clamp(v, 0, 2.0);
    if (!this.muted) this.outGain.gain.value = this.lastVolume;
  }

  toggleMute() {
    if (!this.outGain) return;
    this.muted = !this.muted;
    this.outGain.gain.value = this.muted ? 0 : this.lastVolume;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  setEcho(amount01: number) {
    if (!this.echoMix) return;
    this.echoMix.gain.value = clamp(amount01, 0, 1) * 0.25;
  }

  setRoom(amount01: number) {
    if (!this.roomMix) return;
    this.roomMix.gain.value = clamp(amount01, 0, 1) * 0.12;
  }

  setPreset(p: BoothPreset) {
    switch (p) {
      case "NORMAL":
        this.setEcho(0.0);
        this.setRoom(0.10);
        this.setVolume(1.05);
        break;
      case "ECHO":
        this.setEcho(0.65);
        this.setRoom(0.12);
        this.setVolume(1.08);
        break;
      case "ROOM":
        this.setEcho(0.0);
        this.setRoom(1.0);
        this.setVolume(1.06);
        break;
      case "STAGE":
        this.setEcho(1.0);
        this.setRoom(0.35);
        this.setVolume(1.15);
        break;
    }
  }

  async stopMic(): Promise<void> {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.src = null;

    if (this.ctx) await this.ctx.close();
    this.ctx = null;

    this.hp = null;
    this.presence = null;
    this.comp = null;
    this.outGain = null;

    this.echoDelay = null;
    this.echoFb = null;
    this.echoMix = null;

    this.roomDelay = null;
    this.roomMix = null;
  }
}
