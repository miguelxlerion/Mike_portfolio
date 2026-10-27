import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./motion";

gsap.registerPlugin(Flip, ScrollTrigger);

export function initGallery() {
  const gallery = document.querySelector<HTMLElement>("[data-gallery]");
  if (!gallery) return;

  const buttons = Array.from(gallery.querySelectorAll<HTMLButtonElement>("[data-filter]"));
  const cards = Array.from(gallery.querySelectorAll<HTMLElement>("[data-project]"));
  const status = gallery.querySelector<HTMLElement>("[data-gallery-status]");
  if (!buttons.length || !cards.length) return;

  const reduced = prefersReducedMotion();
  const singular = gallery.dataset.labelSingular ?? "proyecto";
  const plural = gallery.dataset.labelPlural ?? "proyectos";
  let active = "todos";
  let animating = false;

  const matches = (card: HTMLElement, filter: string) =>
    filter === "todos" || card.dataset.category === filter;

  const apply = (filter: string) => {
    if (animating || filter === active) return;

    const visible = cards.filter((card) => matches(card, filter));
    active = filter;

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });

    if (status) {
      status.textContent = `${String(visible.length).padStart(2, "0")} ${
        visible.length === 1 ? singular : plural
      }`;
    }

    if (reduced) {
      cards.forEach((card) => {
        card.style.display = matches(card, filter) ? "" : "none";
      });
      ScrollTrigger.refresh();
      return;
    }

    const state = Flip.getState(cards);

    cards.forEach((card) => {
      card.style.display = matches(card, filter) ? "" : "none";
    });

    animating = true;
    Flip.from(state, {
      duration: 0.55,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.035,
      scale: true,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 0.5, delay: 0.06, ease: "power2.out" },
        ),
      onLeave: (elements) =>
        gsap.to(elements, {
          opacity: 0,
          scale: 0.94,
          duration: 0.22,
          ease: "power2.in",
        }),
      onComplete: () => {
        animating = false;
        ScrollTrigger.refresh();
      },
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => apply(button.dataset.filter ?? "todos"));
  });

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    gallery.addEventListener("pointermove", (event) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>("[data-project]");
      if (!card) return;

      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  }
}
