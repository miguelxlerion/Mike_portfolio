"use client";

import { useEffect, useState } from "react";

type Props = {
  onEnter: (withAudio: boolean) => void;
  visits: number;
};

export default function Loader({ onEnter, visits }: Props) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [audio, setAudio] = useState(true);

  useEffect(() => {
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      setProgress((p) => {
        const next = p + Math.max(0.8, (100 - p) * 0.06) + (frame % 7 === 0 ? 3 : 0);
        return next >= 100 ? 100 : next;
      });
    }, 45);
    return () => window.clearInterval(id);
  }, []);

  const done = progress >= 100;

  const enter = () => {
    if (!done || leaving) return;
    setLeaving(true);
    window.setTimeout(() => onEnter(audio), 900);
  };

  return (
    <div
      className={`grain fixed inset-0 z-50 overflow-hidden bg-[#0d0c0b] transition-all duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{
          backgroundImage: "url(/images/loader.jpg)",
          opacity: 0.5,
          transform: leaving ? "scale(1.35)" : `scale(${1.14 - progress / 900})`,
          filter: "saturate(0.7)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0b]/70 via-[#0d0c0b]/40 to-[#0d0c0b]" />

      <div className="relative flex h-full flex-col justify-between p-6 sm:p-10">
        <div className="mono flex items-start justify-between text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60">
          <span>
            13°43′N 89°13′W
            <br />
            San Salvador · El Salvador
          </span>
          <span className="text-right">
            [ powered by <span className="text-[#E4572E]">CMS</span> ]
            <br />
            {visits.toLocaleString()} flights so far
          </span>
        </div>

        <div className="max-w-5xl">
          <p className="mono mb-4 text-[10px] uppercase tracking-[0.4em] text-[#E4572E]">
            fly to
          </p>
          <h1 className="display text-[19vw] leading-[0.82] sm:text-[15vw] lg:text-[13rem]">
            Zacamil
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[#f4efe6]/70 sm:text-base">
            Zacamil is more than just buildings. An interactive flight over the
            largest social housing complex in El Salvador — now a living open
            air museum. Activate audio for the full experience.
          </p>
        </div>

        <div>
          <div className="mb-5 flex items-center gap-4">
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#f4efe6]/50">
              loading assets
            </div>
            <div className="relative h-px flex-1 bg-[#f4efe6]/15">
              <div
                className="absolute inset-y-0 left-0 bg-[#E4572E] transition-[width] duration-150 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mono w-12 text-right text-[10px] tabular-nums text-[#f4efe6]/70">
              {Math.round(progress)}%
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={enter}
              disabled={!done}
              className={`mono group relative overflow-hidden rounded-full border px-9 py-4 text-[11px] uppercase tracking-[0.3em] transition-all duration-500 ${
                done
                  ? "border-[#f4efe6]/70 text-[#f4efe6] hover:border-[#E4572E]"
                  : "cursor-not-allowed border-[#f4efe6]/15 text-[#f4efe6]/30"
              }`}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-[#0d0c0b]">
                enter the colonia
              </span>
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-[#E4572E] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-y-100" />
            </button>

            <button
              type="button"
              onClick={() => setAudio((a) => !a)}
              className="mono flex items-center gap-3 rounded-full border border-[#f4efe6]/20 px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-[#f4efe6]/70 transition-colors hover:border-[#f4efe6]/60 hover:text-[#f4efe6]"
            >
              <span className="flex h-3 items-end gap-[2px]">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-[2px] bg-current transition-all duration-300"
                    style={{
                      height: audio ? `${5 + ((i * 7) % 9)}px` : "2px",
                      opacity: audio ? 1 : 0.4,
                    }}
                  />
                ))}
              </span>
              sound {audio ? "on" : "off"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
