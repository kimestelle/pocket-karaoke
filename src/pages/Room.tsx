'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioHandler, type BoothPreset } from "../audio/audioHandler";

type Phase = "IDLE" | "COUNTDOWN" | "LIVE" | "ENDED";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export default function Room() {
  const handler = useMemo(
    () => new AudioHandler({ headphoneFirst: true, latencyHint: 0.01 }),
    []
  );

  const tickRafRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("IDLE");
  const phaseRef = useRef<Phase>("IDLE");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const [open, setOpen] = useState(false);

  const [preset, setPreset] = useState<BoothPreset>("ECHO");
  const [volume, setVolume] = useState(1.08);

  const [echo, setEcho] = useState(0.65);
  const [room, setRoom] = useState(0.12);

  const [muted, setMuted] = useState(false);

  const SESSION_SECONDS = 210;
  const [countdown, setCountdown] = useState(3);
  const [remaining, setRemaining] = useState(SESSION_SECONDS);

  const startAtRef = useRef<number>(0);
  const endAtRef = useRef<number>(0);

  function stopTickRaf() {
    if (tickRafRef.current != null) cancelAnimationFrame(tickRafRef.current);
    tickRafRef.current = null;
  }

  const tick = (t: number) => {
    const p = phaseRef.current;

    if (p === "COUNTDOWN") {
      const sLeft = Math.max(0, Math.ceil((startAtRef.current - t) / 1000));
      setCountdown(sLeft);
      if (t >= startAtRef.current) {
        setPhase("LIVE");
        phaseRef.current = "LIVE";
      }
    } else if (p === "LIVE") {
      const sLeft = Math.max(0, Math.ceil((endAtRef.current - t) / 1000));
      setRemaining(sLeft);
      if (t >= endAtRef.current) {
        setPhase("ENDED");
        phaseRef.current = "ENDED";
        setOpen(false);
        stopTickRaf();
        hardStopMic().catch(console.error);
        return;
      }
    } else if (p === "ENDED") {
      stopTickRaf();
      hardStopMic().catch(console.error);
      return;
    } else {
      return;
    }

    tickRafRef.current = requestAnimationFrame(tick);
  };

  async function insertCoinAndStart() {
    await handler.startMic();

    handler.setPreset(preset);
    handler.setVolume(volume);
    handler.setEcho(echo);
    handler.setRoom(room);

    setMuted(handler.isMuted());
    setOpen(true);

    setPhase("COUNTDOWN");
    phaseRef.current = "COUNTDOWN";

    setCountdown(SESSION_SECONDS);
    setRemaining(SESSION_SECONDS);

    stopTickRaf();

    // use RAF timestamp
    tickRafRef.current = requestAnimationFrame((t0) => {
      startAtRef.current = t0 + 3000;
      endAtRef.current = startAtRef.current + SESSION_SECONDS * 1000;
      tickRafRef.current = requestAnimationFrame(tick);
    });
  }


  async function stopSession() {
    stopTickRaf();
    setPhase("ENDED");
    setOpen(false);
  }

  async function hardStopMic() {
    stopTickRaf();
    await handler.stopMic();
    setPhase("IDLE");
    setOpen(false);
    setMuted(false);
  }

  function applyPreset(p: BoothPreset) {
    setPreset(p);
    handler.setPreset(p);
  }
  function applyVolume(v: number) {
    setVolume(v);
    handler.setVolume(v);
  }
  function applyEcho(v: number) {
    setEcho(v);
    handler.setEcho(v);
  }
  function applyRoom(v: number) {
    setRoom(v);
    handler.setRoom(v);
  }
  function toggleMute() {
    const m = !muted;
    handler.toggleMute();
    setMuted(m);
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="h-[100svh] w-[100svw] flex justify-center items-center corridor-bg-top">
      <div
        className="
          relative h-[92svh] w-[92svw] max-w-[100svh]
          border-[2svh] border-baby-pink bg-pink/50
          p-[3svh]
          flex flex-col gap-[2.5svh]
        "
      >
        {/* TOP SIGN */}
        <div className="h-[10svh] w-full flex justify-between items-end">
          <a href='/'>
          <div
            id="sign"
            className={`
              flex px-[1.5svh] py-0 neon rounded-md cursor-pointer
              ${open ? "border-light-teal text-teal" : "border-light-red text-red"}
            `}
          >
            <h2>leave</h2>
          </div>
          </a>

          <div className="flex items-end gap-[1svh]">
            <div className="text-right">
              <h2 className="text-white/80">karaoke booth</h2>
              <div className="text-white/60 text-[2svh] -mt-[0.6svh]">
                sing anytime, anywhere!
              </div>
            </div>
            <div className="w-[6svh] h-[6svh] rounded-full bg-gray-1 relative">
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-[70%] h-[18%] rounded-full bg-gray-2" />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 w-full h-full flex gap-[2svh]">
          {/* WINDOW PANEL */}
          <div className="relative flex-1 bg-white overflow-hidden">
            <img
              className="absolute inset-0 m-auto content-cover w-full h-full pointer-events-none"
              src={open ? "/moving-gradient.svg" : "/moving-gradient-dark.svg"}
              alt="moving-gradient"
            />
            <div
              className="
                absolute inset-0 z-[5]
                 backdrop-blur-xl border-[1svh] border-white/30
                p-[3svh]
                flex flex-col justify-between
              "
            >
              <div className="flex flex-col gap-[2svh]">
                {/* BIG TIMER */}
                <div className="w-full flex justify-between items-end">
                  <div className="text-white/80">
                    <div className="text-[2svh] text-white/60 -mt-[0.5svh]">
                      {phase === "COUNTDOWN" ? "starting…" : phase === "LIVE" ? "singing :-)" : phase === "ENDED" ? "ended" : "ready"}
                    </div>
                  </div>

                  <div className="text-right">
                    {phase === "COUNTDOWN" ? (
                      <div className="carlmarx text-white/85 text-[14svh] leading-none">
                        {countdown}...
                      </div>
                    ) : (
                      <div className="carlmarx text-white/85 text-[14svh] leading-none">
                        {pad2(mm)}:{pad2(ss)}
                      </div>
                    )}
                  </div>
                </div>

                {/* SESSION CONTROLS */}
                <div className="flex gap-[1svh]">
                  {phase === "IDLE" || phase === "ENDED" ? (
                    <button
                      onClick={() => insertCoinAndStart().catch((e) => (console.error(e), alert("Mic start failed.")))}
                      className="
                        neon border-[1svh] border-light-teal text-teal
                        rounded-md px-[2svh] py-[1.5svh]
                        bg-transparent cursor-pointer
                        hover:scale-[1.01] transition
                        flex-1
                      "
                    >
                      <h2>₩500 insert</h2>
                    </button>
                  ) : (
                    <button
                      onClick={() => stopSession().catch(console.error)}
                      className="
                        neon border-[1svh] border-light-red text-red cursor-pointer
                        rounded-md px-[2svh] py-[1.5svh]
                        bg-transparent
                        hover:scale-[1.01] transition
                        flex-1
                      "
                    >
                      <h2>end</h2>
                    </button>
                  )}

                  <button
                    onClick={toggleMute}
                    className={`
                      neon border-[1svh] rounded-md px-[2svh] py-[1.5svh] bg-transparent cursor-pointer
                      ${muted ? "border-light-red text-red" : "border-white/30 text-white/85"}
                    `}
                    title="mute"
                  >
                    <h2>{muted ? "muted" : "mute"}</h2>
                  </button>

                  <button
                    onClick={() => hardStopMic().catch(console.error)}
                    className="
                      neon border-[1svh] rounded-md px-[2svh] py-[1.5svh] bg-transparent border-white/30 text-white/85 cursor-pointer
                    "
                    title="Stop mic + reset"
                  >
                    <h3 className="text-[2.6svh] leading-none">reset</h3>
                  </button>
                </div>

                {/* INFO */}
                <div className="text-white/60 text-[2svh]">
                  headphones recommended • play backing track on another tab/device
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="w-[34svh] flex flex-col gap-[2svh]">
            {/* MODE */}
            <div className="border-[1svh] border-baby-pink bg-pink/50 p-[1svh] px-[2svh] flex flex-col gap-[1.2svh]">
              <h2 className="text-white/85">mode</h2>
              <div className="grid grid-cols-2 gap-[1svh]">
                {(["NORMAL", "ECHO", "ROOM", "STAGE"] as BoothPreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`
                      rounded-md shadow-md cursor-pointer
                      ${preset === p ? "border-light-teal text-teal" : "border-white/30 text-neutral-400"}
                      px-[1svh] py-[0.5svh]
                    `}
                  >
                    <h3 className="text-[2.6svh] leading-none">{p.toLowerCase()}</h3>
                  </button>
                ))}
              </div>
              <div className="text-white/60 text-[2svh]">
                use NORMAL for less delay
              </div>
            </div>

            {/* VOLUME */}
            <div className="border-[1svh] border-baby-pink bg-pink/50 p-[1svh] px-[2svh] flex flex-col gap-[1.2svh]">
              <h2 className="text-white/85">volume</h2>
              <input
                type="range"
                min={0}
                max={2.0}
                step={0.01}
                value={volume}
                onChange={(e) => applyVolume(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[2svh] text-white/70">
                <span>0</span>
                <span className="carlmarx text-white/85">{volume.toFixed(2)}×</span>
                <span>2.0</span>
              </div>
            </div>

            {/* FX SLIDERS */}
            <div className="border-[1svh] border-baby-pink bg-pink/50 p-[1svh] px-[2svh] flex flex-col gap-[1.2svh]">
              <h2 className="text-white/85">fx</h2>

              <div className="flex flex-col gap-[0.8svh]">
                <div className="flex justify-between text-white/70 text-[2svh]">
                  <span>echo</span>
                  <span className="carlmarx text-white/85">{echo.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={echo}
                  onChange={(e) => applyEcho(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-[0.8svh]">
                <div className="flex justify-between text-white/70 text-[2svh]">
                  <span>room</span>
                  <span className="carlmarx text-white/85">{room.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={room}
                  onChange={(e) => applyRoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
