"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Pin, Voice } from "@/db/schema";
import Loader from "./Loader";
import MapStage, { type MapStageHandle } from "./MapStage";
import PinDetail from "./PinDetail";
import Overlay from "./Overlay";
import VoicesPanel from "./VoicesPanel";
import CmsPanel from "./CmsPanel";
import { useAmbientAudio } from "./useAmbientAudio";

type Props = {
  initialPins: Pin[];
  initialVoices: Voice[];
  initialVisits: number;
};

type OverlayKey = "about" | "voices" | "cms" | null;

const HINTS = [
  "click and drag to explore",
  "scroll to zoom in & out",
  "click on the pins to learn more",
];

export default function Experience({
  initialPins,
  initialVoices,
  initialVisits,
}: Props) {
  const [entered, setEntered] = useState(false);
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<OverlayKey>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [visits, setVisits] = useState(initialVisits);
  const [placing, setPlacing] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState(0);
  const stage = useRef<MapStageHandle>(null);
  const audio = useAmbientAudio();

  useEffect(() => {
    const id = window.setInterval(
      () => setHint((h) => (h + 1) % HINTS.length),
      3600,
    );
    return () => window.clearInterval(id);
  }, []);

  const activeIndex = pins.findIndex((p) => p.id === activeId);
  const activePin = activeIndex >= 0 ? pins[activeIndex] : null;

  const select = useCallback((pin: Pin) => {
    setActiveId(pin.id);
    setIndexOpen(false);
    const offset = window.innerWidth < 1024 ? 0.5 : 0.28;
    stage.current?.focusPin(pin, offset);
  }, []);

  const step = (dir: number) => {
    if (!pins.length) return;
    const next = pins[(activeIndex + dir + pins.length) % pins.length];
    select(next);
  };

  const close = () => {
    setActiveId(null);
    stage.current?.reset();
  };

  const enter = (withAudio: boolean) => {
    setEntered(true);
    if (withAudio) window.setTimeout(() => audio.toggle(), 200);
    void fetch("/api/visits", { method: "POST" })
      .then((r) => r.json() as Promise<{ count: number }>)
      .then((d) => setVisits(d.count))
      .catch(() => undefined);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (overlay) setOverlay(null);
        else if (activeId) close();
      }
      if (!activeId || overlay) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const navItem =
    "mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60 transition-colors hover:text-[#f4efe6]";

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#0d0c0b]">
      <MapStage
        ref={stage}
        pins={pins}
        activeId={activeId}
        onSelect={select}
        placingMode={placing}
        onPlace={(x, y) => {
          setCoords({ x, y });
          setPlacing(false);
          setOverlay("cms");
        }}
      />

      {/* ---------- top bar ---------- */}
      <header
        className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-5 transition-all duration-1000 sm:p-7 ${
          entered ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={close}
          className="pointer-events-auto text-left"
        >
          <span className="display block text-2xl leading-none">Zacamil</span>
          <span className="mono mt-1 block text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/45">
            open air museum · sv
          </span>
        </button>

        <nav className="pointer-events-auto flex items-center gap-5 sm:gap-7">
          <button className={navItem} onClick={() => setOverlay("about")}>
            about
          </button>
          <button className={navItem} onClick={() => setOverlay("voices")}>
            voices
          </button>
          <button className={navItem} onClick={() => setOverlay("cms")}>
            [cms]
          </button>
          <button
            onClick={audio.toggle}
            className="mono flex items-center gap-2 rounded-full border border-[#f4efe6]/20 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f4efe6]/70 transition-colors hover:border-[#f4efe6]/60"
          >
            <span className="flex h-3 items-end gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-[2px] bg-current"
                  style={{
                    height: audio.enabled ? `${4 + ((i * 5) % 8)}px` : "2px",
                    transition: "height 400ms ease",
                    animation: audio.enabled
                      ? `grainshift ${700 + i * 160}ms ease-in-out infinite alternate`
                      : undefined,
                  }}
                />
              ))}
            </span>
            {audio.enabled ? "sound on" : "sound off"}
          </button>
        </nav>
      </header>

      {/* ---------- hint ---------- */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center transition-opacity duration-1000 ${
          entered && !activePin && !overlay ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="mono rounded-full border border-[#f4efe6]/15 bg-[#0d0c0b]/40 px-5 py-2 text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/60 backdrop-blur-sm">
          {HINTS[hint]}
        </span>
      </div>

      {/* ---------- bottom index ---------- */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-1000 ${
          entered && !activePin ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="mono flex items-center justify-between px-5 pb-3 text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/40 sm:px-7">
          <span>{pins.length} interventions mapped</span>
          <button
            onClick={() => setIndexOpen((v) => !v)}
            className="transition-colors hover:text-[#f4efe6]"
          >
            {indexOpen ? "hide index −" : "open index +"}
          </button>
        </div>
        <div
          className={`overflow-hidden border-t border-[#f4efe6]/10 bg-[#0d0c0b]/70 backdrop-blur-xl transition-[max-height] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            indexOpen ? "max-h-[42vh]" : "max-h-0"
          }`}
        >
          <div className="no-scrollbar flex gap-px overflow-x-auto bg-[#f4efe6]/10 p-px">
            {pins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => select(pin)}
                className="group relative w-56 shrink-0 bg-[#0d0c0b] p-5 text-left transition-colors hover:bg-[#171513]"
              >
                <span
                  className="mono block text-[9px] uppercase tracking-[0.3em]"
                  style={{ color: pin.accent }}
                >
                  {String(pin.number).padStart(2, "0")} / {pin.category}
                </span>
                <span className="display mt-3 block text-2xl leading-tight">
                  {pin.title}
                </span>
                <span className="mono mt-2 block truncate text-[9px] uppercase tracking-[0.2em] text-[#f4efe6]/40">
                  {pin.artist || pin.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mono overflow-hidden whitespace-nowrap border-t border-[#f4efe6]/10 bg-[#0d0c0b] py-2 text-[9px] uppercase tracking-[0.35em] text-[#f4efe6]/30">
          <div className="marquee-track inline-block">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i}>
                zacamil is more than just buildings · 50+ murals · community
                driven · san salvador, el salvador · {visits.toLocaleString()}{" "}
                flights ·{" "}
              </span>
            ))}
          </div>
        </div>
      </div>

      <PinDetail
        pin={activePin}
        onClose={close}
        onNext={() => step(1)}
        onPrev={() => step(-1)}
        index={Math.max(activeIndex, 0)}
        total={pins.length}
      />

      <Overlay
        open={overlay === "about"}
        onClose={() => setOverlay(null)}
        label="about the project"
        title="More than just buildings."
      >
        <div className="space-y-10">
          <div className="grid gap-8 border-y border-[#f4efe6]/10 py-8 sm:grid-cols-4">
            {[
              ["1974", "first blocks built"],
              ["50+", "murals painted"],
              ["8", "mapped pins"],
              ["∞", "stories left"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="display text-4xl">{k}</div>
                <div className="mono mt-2 text-[9px] uppercase tracking-[0.25em] text-[#f4efe6]/40">
                  {v}
                </div>
              </div>
            ))}
          </div>
          <p className="max-w-2xl text-[17px] leading-[1.8] text-[#f4efe6]/80">
            Zacamil is one of the largest social housing complexes in El
            Salvador: a grid of concrete blocks raised in the seventies for
            families arriving from the countryside. It carried the weight of the
            armed conflict, and later of years in which its alleys were not its
            own.
          </p>
          <p className="max-w-2xl text-[15px] leading-[1.8] text-[#f4efe6]/65">
            Since 2024 local and international artists have been repainting its
            facades, stairwells and courts alongside the people who live in
            them. The result is an open air museum that is not a backdrop but a
            neighbourhood: shops reopening, a court in use again, buildings that
            can be seen from the valley at night.
          </p>
          <p className="max-w-2xl text-[15px] leading-[1.8] text-[#f4efe6]/65">
            This site is an interactive flight over that map. Every pin is an
            intervention, a wall, a story — added from the ground and published
            live. Drag to move, scroll to zoom, and take your time.
          </p>
          <div className="mono grid gap-6 border-t border-[#f4efe6]/10 pt-8 text-[10px] uppercase tracking-[0.25em] text-[#f4efe6]/45 sm:grid-cols-3">
            <div>
              location
              <br />
              <span className="text-[#f4efe6]/80">Mejicanos, San Salvador</span>
            </div>
            <div>
              status
              <br />
              <span className="text-[#f4efe6]/80">Ongoing since 2024</span>
            </div>
            <div>
              built with
              <br />
              <span className="text-[#f4efe6]/80">Next.js · Postgres · Web Audio</span>
            </div>
          </div>
        </div>
      </Overlay>

      <Overlay
        open={overlay === "voices"}
        onClose={() => setOverlay(null)}
        label="the open wall"
        title="Voices."
      >
        <VoicesPanel initial={initialVoices} />
      </Overlay>

      <Overlay
        open={overlay === "cms"}
        onClose={() => setOverlay(null)}
        label="powered by cms"
        title="Add a wall."
      >
        <CmsPanel
          coords={coords}
          placing={placing}
          onStartPlacing={() => {
            setPlacing(true);
            setOverlay(null);
          }}
          onCreated={(pin) => {
            setPins((prev) => [...prev, pin]);
            setCoords(null);
            window.setTimeout(() => {
              setOverlay(null);
              select(pin);
            }, 900);
          }}
        />
      </Overlay>

      {placing && (
        <div className="mono pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center">
          <span className="rounded-full bg-[#E4572E] px-5 py-2 text-[9px] uppercase tracking-[0.3em] text-[#0d0c0b]">
            click anywhere on the map to drop your pin
          </span>
        </div>
      )}

      {!entered && <Loader onEnter={enter} visits={visits} />}
    </main>
  );
}
