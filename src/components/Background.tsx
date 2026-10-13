import { useEffect, useRef } from "react";
import { useSite } from "../store/SiteContext";

/** Red de partículas con repulsión al ratón (lo mejor del Hero del Ejemplo 1) */
export default function ParticleCanvas({ density = 16000, maxLinks = 120 }: { density?: number; maxLinks?: number }) {
  const { content } = useSite();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!content.appearance.showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const hexToRgb = (hex: string): [number, number, number] => {
      const h = hex.replace("#", "");
      const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
      const n = parseInt(v, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const [ar, ag, ab] = hexToRgb(content.appearance.accent);
    const mouse = { x: -9999, y: -9999 };
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    interface P { x: number; y: number; vx: number; vy: number; r: number }
    let points: P[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(90, Math.floor((w * h) / density));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dxm = p.x - mouse.x;
        const dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 130 && dm > 0.01) {
          p.x += (dxm / dm) * 0.7;
          p.y += (dym / dm) * 0.7;
        }
      }
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxLinks) {
            ctx.strokeStyle = `rgba(${ar},${ag},${ab},${(1 - d / maxLinks) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of points) {
        ctx.fillStyle = "rgba(228,228,231,0.65)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    step();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [density, maxLinks, content.appearance.showParticles, content.appearance.accent]);

  if (!content.appearance.showParticles) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" aria-hidden />;
}
