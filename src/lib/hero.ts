import gsap from "gsap";
import { prefersReducedMotion } from "./motion";

function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function initMagnetic(hero: HTMLElement) {
  if (!hasFinePointer()) return;

  hero.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });

    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - rect.left - rect.width / 2) * 0.2);
      yTo((event.clientY - rect.top - rect.height / 2) * 0.28);
      el.classList.add("is-magnetic");
    });

    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
      el.classList.remove("is-magnetic");
    });
  });
}

function initPanelParallax(hero: HTMLElement, reduced: boolean) {
  const panel = hero.querySelector<HTMLElement>("[data-hero-panel]");
  if (!panel || reduced || !hasFinePointer()) return;

  gsap.set(panel, { transformPerspective: 1000 });

  const xTo = gsap.quickTo(panel, "x", { duration: 0.9, ease: "power3.out" });
  const yTo = gsap.quickTo(panel, "y", { duration: 0.9, ease: "power3.out" });
  const ryTo = gsap.quickTo(panel, "rotationY", { duration: 0.9, ease: "power3.out" });
  const rxTo = gsap.quickTo(panel, "rotationX", { duration: 0.9, ease: "power3.out" });

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    xTo(relX * 14);
    yTo(relY * 10);
    ryTo(relX * 5);
    rxTo(relY * -4);
  });

  hero.addEventListener("pointerleave", () => {
    xTo(0);
    yTo(0);
    ryTo(0);
    rxTo(0);
  });
}

export function initHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;

  const reduced = prefersReducedMotion();

  if (!reduced) {
    const lines = hero.querySelectorAll<HTMLElement>("[data-hero-line]");
    const words = hero.querySelectorAll<HTMLElement>("[data-hero-word]");
    const fades = hero.querySelectorAll<HTMLElement>("[data-hero-fade]");

    gsap
      .timeline({ defaults: { ease: "power4.out" }, delay: 0.15 })
      .fromTo(
        lines,
        { opacity: 0, yPercent: 112 },
        { opacity: 1, yPercent: 0, duration: 1.15, stagger: 0.085 },
      )
      .fromTo(
        words,
        { opacity: 0, yPercent: 70 },
        { opacity: 1, yPercent: 0, duration: 0.7, stagger: 0.022 },
        "-=0.72",
      )
      .fromTo(
        fades,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
        "-=0.55",
      );

    initMagnetic(hero);
  }

  initPanelParallax(hero, reduced);
}
