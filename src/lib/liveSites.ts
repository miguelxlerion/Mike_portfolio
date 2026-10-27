type SiteState = "checking" | "live" | "down";

function setState(site: HTMLElement, state: SiteState) {
  site.dataset.state = state;

  const dot = site.querySelector<HTMLElement>("[data-live-dot]");
  const label = site.querySelector<HTMLElement>("[data-live-label]");
  if (dot) dot.dataset.state = state;
  if (label) {
    label.textContent =
      state === "live" ? "En vivo" : state === "down" ? "Sin respuesta" : "Comprobando";
  }
}

async function check(site: HTMLElement) {
  const url = site.dataset.liveSite;
  if (!url) return;

  setState(site, "checking");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);

  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: controller.signal });
    setState(site, "live");
  } catch {
    setState(site, "down");
  } finally {
    window.clearTimeout(timeout);
  }
}

export function initLiveSites() {
  const sites = Array.from(document.querySelectorAll<HTMLElement>("[data-live-site]"));
  if (!sites.length) return;

  if (!("IntersectionObserver" in window)) {
    sites.forEach((site) => void check(site));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        void check(entry.target as HTMLElement);
      });
    },
    { rootMargin: "200px" },
  );

  sites.forEach((site) => observer.observe(site));
}
