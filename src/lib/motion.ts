import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initSmoothScroll(reduced: boolean) {
  if (reduced) return;

  lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function initAnchors(reduced: boolean) {
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.hasAttribute("data-skip-link")) return;

    const hash = link.getAttribute("href");
    if (!hash || hash.length < 2) return;

    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;

    event.preventDefault();

    if (target.tabIndex < 0) target.tabIndex = -1;
    const focusTarget = () => target.focus({ preventScroll: true });

    if (lenis && !reduced) {
      lenis.scrollTo(target, { offset: -88, duration: 1.1, onComplete: focusTarget });
    } else {
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      focusTarget();
    }

    window.history.replaceState(null, "", hash);
  });
}

function initReveals(reduced: boolean) {
  if (reduced) return;

  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  if (!items.length) return;

  gsap.set(items, { opacity: 0, y: 24 });

  ScrollTrigger.batch(items, {
    start: "top 88%",
    once: true,
    interval: 0.12,
    batchMax: 6,
    onEnter: (batch) => {
      batch.forEach((el) => el.classList.add("is-revealing"));
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        overwrite: true,
        onComplete: () => batch.forEach((el) => el.classList.remove("is-revealing")),
      });
    },
  });
}

function initHeader() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return;

  header.toggleAttribute("data-scrolled", window.scrollY > 16);

  ScrollTrigger.create({
    start: 16,
    end: "max",
    onToggle: (self) => header.toggleAttribute("data-scrolled", self.isActive),
  });
}

function initProgress() {
  const bar = document.querySelector<HTMLElement>("[data-scroll-progress]");
  if (!bar) return;

  const setScale = gsap.quickSetter(bar, "scaleX") as (value: number) => void;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => setScale(self.progress),
  });
}

function initMenuBridge() {
  window.addEventListener("portfolio:menu", (event) => {
    const open = (event as CustomEvent<{ open: boolean }>).detail?.open ?? false;
    if (open) lenis?.stop();
    else lenis?.start();
  });
}

function refreshAfterLoad() {
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export function initMotion() {
  const root = document.documentElement;
  const reduced = prefersReducedMotion();

  if (reduced) root.classList.add("motion-reduced");

  initSmoothScroll(reduced);
  initAnchors(reduced);
  initReveals(reduced);
  initHeader();
  initProgress();
  initMenuBridge();

  requestAnimationFrame(() => {
    refreshAfterLoad();
    root.classList.add("is-motion-ready");
  });
}
