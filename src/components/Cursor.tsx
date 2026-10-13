import { useEffect, useState } from "react";
import { useSite } from "../store/SiteContext";

export default function Cursor() {
  const { content } = useSite();
  const [enabled] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  const [mode, setMode] = useState<"default" | "hover" | "text">("default");
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ring, setRing] = useState({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled || !content.appearance.showCursor) return;
    document.body.classList.add("has-custom-cursor");
    let raf = 0;
    const target = { x: -100, y: -100 };
    const cur = { x: -100, y: -100 };
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setPos({ x: e.clientX, y: e.clientY });
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) setMode("text");
      else if (t?.closest("a, button, [data-cursor='hover']")) setMode("hover");
      else setMode("default");
    };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.16;
      cur.y += (target.y - cur.y) * 0.16;
      setRing({ x: cur.x, y: cur.y });
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [enabled, content.appearance.showCursor]);

  if (!enabled || !content.appearance.showCursor) return null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-acid"
        style={{ transform: `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border transition-[width,height,border-color] duration-200"
        style={{
          width: mode === "hover" ? 44 : mode === "text" ? 56 : 28,
          height: mode === "hover" ? 44 : mode === "text" ? 56 : 28,
          borderColor: mode === "default" ? "rgba(163,230,53,.5)" : "rgba(163,230,53,.9)",
          transform: `translate3d(${ring.x - (mode === "default" ? 14 : mode === "hover" ? 22 : 28)}px, ${ring.y - (mode === "default" ? 14 : mode === "hover" ? 22 : 28)}px, 0)`,
        }}
      />
    </>
  );
}
