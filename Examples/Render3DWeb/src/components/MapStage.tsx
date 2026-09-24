"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Pin } from "@/db/schema";

export type MapStageHandle = {
  focusPin: (pin: Pin, offsetRatio?: number) => void;
  reset: () => void;
};

type Props = {
  pins: Pin[];
  activeId: number | null;
  onSelect: (pin: Pin) => void;
  placingMode: boolean;
  onPlace: (x: number, y: number) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4.2;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const MapStage = forwardRef<MapStageHandle, Props>(function MapStage(
  { pins, activeId, onSelect, placingMode, onPlace },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1.25, x: 0, y: 0 });
  const [animate, setAnimate] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0, s: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(
    null,
  );
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height, s: Math.max(r.width, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clampView = useCallback(
    (v: { scale: number; x: number; y: number }) => {
      const s = size.s * v.scale;
      const maxX = Math.max(0, (s - size.w) / 2);
      const maxY = Math.max(0, (s - size.h) / 2);
      return {
        scale: v.scale,
        x: clamp(v.x, -maxX, maxX),
        y: clamp(v.y, -maxY, maxY),
      };
    },
    [size],
  );

  useImperativeHandle(ref, () => ({
    focusPin: (pin: Pin, offsetRatio = 0.5) => {
      if (!size.s) return;
      const scale = size.w < 900 ? 2.1 : 2.4;
      const offX = (pin.x / 100 - 0.5) * size.s * scale;
      const offY = (pin.y / 100 - 0.5) * size.s * scale;
      const targetX = size.w * offsetRatio;
      const targetY = size.h * (size.w < 900 ? 0.34 : 0.5);
      setAnimate(true);
      setView(
        clampView({
          scale,
          x: targetX - size.w / 2 - offX,
          y: targetY - size.h / 2 - offY,
        }),
      );
    },
    reset: () => {
      setAnimate(true);
      setView(clampView({ scale: 1.25, x: 0, y: 0 }));
    },
  }));

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      setAnimate(false);
      setView((v) => {
        const nextScale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
        const k = nextScale / v.scale;
        const px = cx - size.w / 2;
        const py = cy - size.h / 2;
        return clampView({
          scale: nextScale,
          x: px - (px - v.x) * k,
          y: py - (py - v.y) * k,
        });
      });
    },
    [clampView, size],
  );

  const onWheel = (e: React.WheelEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = Math.exp(-e.deltaY * 0.0016);
    zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      setAnimate(false);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextScale = clamp(
        (pinchStart.current.scale * dist) / pinchStart.current.dist,
        MIN_SCALE,
        MAX_SCALE,
      );
      moved.current = true;
      setView((v) => {
        const k = nextScale / v.scale;
        const px = (a.x + b.x) / 2 - rect.left - size.w / 2;
        const py = (a.y + b.y) / 2 - rect.top - size.h / 2;
        return clampView({
          scale: nextScale,
          x: px - (px - v.x) * k,
          y: py - (py - v.y) * k,
        });
      });
      return;
    }

    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true;
    setView((v) =>
      clampView({
        scale: v.scale,
        x: dragStart.current!.vx + dx,
        y: dragStart.current!.vy + dy,
      }),
    );
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const handleStageClick = (e: React.MouseEvent) => {
    if (!placingMode || moved.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left - size.w / 2 - view.x;
    const py = e.clientY - rect.top - size.h / 2 - view.y;
    const x = (px / (size.s * view.scale) + 0.5) * 100;
    const y = (py / (size.s * view.scale) + 0.5) * 100;
    onPlace(clamp(x, 1, 99), clamp(y, 1, 99));
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClick={handleStageClick}
      className={`absolute inset-0 touch-none overflow-hidden bg-[#0d0c0b] ${
        placingMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: size.s,
          height: size.s,
          marginLeft: -size.s / 2,
          marginTop: -size.s / 2,
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          transition: animate
            ? "transform 1300ms cubic-bezier(0.76, 0, 0.24, 1)"
            : "none",
          willChange: "transform",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(/images/map.jpg)",
            filter: "saturate(0.92) contrast(1.05) brightness(0.86)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_35%,rgba(13,12,11,0.55)_100%)]" />

        {pins.map((pin) => {
          const isActive = pin.id === activeId;
          return (
            <button
              key={pin.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (moved.current || placingMode) return;
                onSelect(pin);
              }}
              className="group absolute"
              style={{
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                transform: `translate(-50%, -50%) scale(${1 / view.scale})`,
                transition: animate ? "transform 1300ms cubic-bezier(0.76,0,0.24,1)" : "none",
              }}
              aria-label={pin.title}
            >
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span
                  className="pin-pulse absolute h-6 w-6 rounded-full"
                  style={{ background: pin.accent, opacity: 0.5 }}
                />
                <span
                  className={`relative flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-semibold transition-all duration-500 ${
                    isActive
                      ? "scale-125 border-transparent text-[#0d0c0b]"
                      : "border-[#f4efe6]/80 bg-[#0d0c0b]/60 text-[#f4efe6] group-hover:scale-125"
                  }`}
                  style={isActive ? { background: pin.accent } : undefined}
                >
                  {pin.number}
                </span>
              </span>
              <span
                className="mono pointer-events-none absolute left-1/2 top-full block -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0d0c0b]/80 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-[#f4efe6] opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100"
              >
                {pin.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* zoom controls */}
      <div className="absolute bottom-6 right-5 z-20 flex flex-col gap-px overflow-hidden rounded-full border border-[#f4efe6]/20 bg-[#0d0c0b]/60 backdrop-blur">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomAt(1.35, size.w / 2, size.h / 2);
          }}
          className="px-3 py-2 text-sm text-[#f4efe6]/80 transition-colors hover:bg-[#E4572E] hover:text-[#0d0c0b]"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomAt(1 / 1.35, size.w / 2, size.h / 2);
          }}
          className="px-3 py-2 text-sm text-[#f4efe6]/80 transition-colors hover:bg-[#E4572E] hover:text-[#0d0c0b]"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      <div className="mono pointer-events-none absolute bottom-7 left-5 z-20 text-[9px] uppercase tracking-[0.28em] text-[#f4efe6]/40">
        zoom {view.scale.toFixed(2)}×
      </div>
    </div>
  );
});

export default MapStage;
