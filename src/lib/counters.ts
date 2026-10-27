import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./motion";

gsap.registerPlugin(ScrollTrigger);

const formatter = new Intl.NumberFormat("es-CO");

export function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>("[data-counter]");
  if (!counters.length) return;

  const reduced = prefersReducedMotion();

  counters.forEach((el) => {
    const target = Number(el.dataset.value ?? "0");

    if (reduced) {
      el.textContent = formatter.format(target);
      return;
    }

    el.textContent = "0";

    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        const state = { value: 0 };
        gsap.to(state, {
          value: target,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = formatter.format(Math.round(state.value));
          },
          onComplete: () => {
            el.textContent = formatter.format(target);
          },
        });
      },
    });
  });
}
