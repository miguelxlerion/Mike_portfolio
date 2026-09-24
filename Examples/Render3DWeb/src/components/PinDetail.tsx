"use client";

import type { Pin } from "@/db/schema";

type Props = {
  pin: Pin | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  index: number;
  total: number;
};

export default function PinDetail({
  pin,
  onClose,
  onNext,
  onPrev,
  index,
  total,
}: Props) {
  const open = Boolean(pin);

  return (
    <aside
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[62vh] transition-transform duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[44vw] lg:max-w-[640px] ${
        open
          ? "translate-y-0 lg:translate-x-0"
          : "translate-y-full lg:translate-y-0 lg:translate-x-full"
      }`}
    >
      {pin && (
        <div className="pointer-events-auto grain relative flex h-full flex-col overflow-hidden border-t border-[#f4efe6]/10 bg-[#131110]/95 backdrop-blur-xl lg:border-l lg:border-t-0">
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: pin.accent }}
          />

          <div className="relative h-[30%] shrink-0 overflow-hidden lg:h-[38%]">
            <img
              src={pin.imageUrl}
              alt={pin.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131110] via-transparent to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="mono absolute right-4 top-4 rounded-full border border-[#f4efe6]/30 bg-[#0d0c0b]/60 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#f4efe6] backdrop-blur transition-colors hover:bg-[#E4572E] hover:text-[#0d0c0b]"
            >
              close ✕
            </button>
          </div>

          <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-28 pt-6 sm:px-10">
            <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#f4efe6]/45">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: pin.accent }}
              />
              pin {String(pin.number).padStart(2, "0")} · {pin.category} · {pin.year}
            </div>

            <h2 className="display mt-4 text-5xl sm:text-6xl">{pin.title}</h2>
            <p className="mono mt-3 text-[11px] uppercase tracking-[0.2em] text-[#f4efe6]/50">
              {pin.subtitle}
              {pin.artist ? ` — ${pin.artist}` : ""}
            </p>

            <p className="mt-7 text-[15px] leading-[1.75] text-[#f4efe6]/80">
              {pin.body}
            </p>

            {pin.quote && (
              <blockquote
                className="mt-8 border-l-2 pl-5"
                style={{ borderColor: pin.accent }}
              >
                <p className="display text-2xl leading-tight text-[#f4efe6]">
                  “{pin.quote}”
                </p>
                <cite className="mono mt-3 block text-[10px] uppercase not-italic tracking-[0.25em] text-[#f4efe6]/45">
                  {pin.quoteAuthor}
                </cite>
              </blockquote>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#f4efe6]/10 bg-[#131110]/90 px-6 py-4 backdrop-blur sm:px-10">
            <button
              type="button"
              onClick={onPrev}
              className="mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60 transition-colors hover:text-[#E4572E]"
            >
              ← previous
            </button>
            <span className="mono text-[10px] tabular-nums tracking-[0.28em] text-[#f4efe6]/35">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={onNext}
              className="mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60 transition-colors hover:text-[#E4572E]"
            >
              next →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
