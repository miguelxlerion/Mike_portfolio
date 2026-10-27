import { BASE, connect, createReport, sleep } from "./lib.mjs";

const ES_NAV = ["Impacto", "Proyectos", "Sitios", "Stack", "Contacto"];
const EN_NAV = ["Impact", "Projects", "Sites", "Stack", "Contact"];
const ES_FILTERS = ["Todos", "AI & Data", "Frontend & 3D", "DevOps"];
const EN_FILTERS = ["All", "AI & Data", "Frontend & 3D", "DevOps"];
const EN_ERRORS = [
  "Enter your name (at least 2 characters).",
  "Enter a valid email, e.g. name@company.com.",
  "Tell me a bit more: at least 20 characters.",
];
const SPANISH_UI = [
  "Impacto",
  "Proyectos",
  "Sitios",
  "Contacto",
  "Hablemos",
  "Descargar",
  "Explorar",
  "Enviar mensaje",
  "Volver",
  "Comprobando",
  "En vivo",
  "Pausado",
  "Detener",
  "Caso privado",
  "Ver repositorio",
  "Credenciales",
  "Cargando",
  "Activar visor",
  "Sin respuesta",
  "Reanudar",
  "Visitar sitio",
  "Abrir menú",
  "Cerrar menú",
  "Idioma",
  "Navegación principal",
  "Navegación móvil",
  "Todos",
];

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const client = await connect();
const report = createReport();

await client.viewport(1440, 900, false);
await client.navigate(`${BASE}/?qa=1#proyectos`);

const readState = () =>
  client.evaluate(() => ({
    path: location.pathname,
    hash: location.hash,
    lang: document.documentElement.lang,
    nav: [...document.querySelectorAll("[data-nav-link]")].map((link) => link.textContent.trim()),
    filters: [...document.querySelectorAll("[data-filter]")].map((button) =>
      (button.childNodes[0]?.textContent ?? "").trim(),
    ),
    menuLabel: document.querySelector("[data-menu-label]")?.textContent?.trim(),
    mobileNavLabel: document.querySelector("#mobile-menu nav")?.getAttribute("aria-label"),
    switchHref: document.querySelector("[data-lang-link]")?.getAttribute("data-href"),
    galleryStatus: document.querySelector("[data-gallery-status]")?.textContent?.replace(/\s+/g, " ").trim(),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => ({
      lang: link.getAttribute("hreflang"),
      href: link.getAttribute("href"),
    })),
    text: document.body.innerText,
  }));

async function switchLanguage(label) {
  try {
    await client.evaluate((target) => {
      const link = [...document.querySelectorAll("[data-lang-link]")].find(
        (candidate) => candidate.textContent.trim() === target,
      );
      link?.click();
    }, label);
  } catch {}
  await sleep(2600);
  await client.waitFor(() => document.readyState === "complete");
}

const es = await readState();
report.check("ES: html lang", es.lang === "es", es.lang);
report.check("ES: navigation", same(es.nav, ES_NAV), es.nav);
report.check("ES: filters", same(es.filters, ES_FILTERS), es.filters);
report.check("ES: menu label", es.menuLabel === "Abrir menú", es.menuLabel);
report.check("ES: mobile nav label", es.mobileNavLabel === "Navegación móvil", es.mobileNavLabel);
report.check("ES: switch points to /en/", es.switchHref === "/en/", es.switchHref);
report.check("ES: gallery status", es.galleryStatus?.startsWith("04"), es.galleryStatus);
report.check("ES: canonical", es.canonical?.endsWith("/"), es.canonical);
report.check(
  "ES: hreflang set",
  es.hreflang.length === 3 &&
    es.hreflang.some((entry) => entry.lang === "en" && entry.href.endsWith("/en/")) &&
    es.hreflang.some((entry) => entry.lang === "x-default"),
  es.hreflang,
);

await switchLanguage("EN");

const en = await readState();
report.check("EN: route keeps hash", en.path === "/en/" && en.hash === "#proyectos", `${en.path}${en.hash}`);
report.check("EN: html lang", en.lang === "en", en.lang);
report.check("EN: navigation", same(en.nav, EN_NAV), en.nav);
report.check("EN: filters", same(en.filters, EN_FILTERS), en.filters);
report.check("EN: menu label", en.menuLabel === "Open menu", en.menuLabel);
report.check("EN: mobile nav label", en.mobileNavLabel === "Mobile navigation", en.mobileNavLabel);
report.check("EN: switch points to /", en.switchHref === "/", en.switchHref);
report.check("EN: gallery status", en.galleryStatus?.startsWith("04"), en.galleryStatus);
report.check("EN: canonical", en.canonical?.endsWith("/en/"), en.canonical);
report.check(
  "EN: hreflang set",
  en.hreflang.length === 3 &&
    en.hreflang.some((entry) => entry.lang === "es" && entry.href.endsWith("/")),
  en.hreflang,
);
report.check(
  "EN: no Spanish UI leftovers",
  SPANISH_UI.every((word) => !en.text.includes(word)),
  SPANISH_UI.filter((word) => en.text.includes(word)),
);

const gallery = await client.evaluate(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const snapshot = () => ({
    status: document.querySelector("[data-gallery-status]")?.textContent?.replace(/\s+/g, " ").trim(),
    visible: [...document.querySelectorAll("[data-project]")].filter(
      (card) => getComputedStyle(card).display !== "none",
    ).length,
  });

  document.querySelector('[data-filter="ai-data"]')?.click();
  await wait(1300);
  const filtered = snapshot();

  document.querySelector('[data-filter="todos"]')?.click();
  await wait(1300);

  return { filtered, all: snapshot() };
});
report.check("EN: AI filter count", gallery.filtered.status === "01 project", gallery.filtered);
report.check("EN: AI filter cards", gallery.filtered.visible === 1, gallery.filtered.visible);
report.check("EN: all filter count", gallery.all.status === "04 projects", gallery.all);
report.check("EN: all filter cards", gallery.all.visible === 4, gallery.all.visible);

const contact = await client.evaluate(async () => {
  document.querySelector("[data-submit]")?.click();
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    errors: [...document.querySelectorAll("[data-error-for]")]
      .filter((element) => !element.hidden)
      .map((element) => element.textContent.trim()),
    status: document.querySelector("[data-form-status]")?.textContent?.trim(),
  };
});
report.check("EN: form errors", same(contact.errors, EN_ERRORS), contact.errors);
report.check(
  "EN: form status",
  contact.status === "Review the highlighted fields before continuing.",
  contact.status,
);

const viewer = await client.evaluate(async () => {
  const section = document.querySelector("#visor");
  if (!section) return { error: "viewer section missing" };
  section.scrollIntoView();
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const activate = section.querySelector('button[aria-label="Activate interactive 3D viewer"]');
  if (!activate) return { error: "activate button missing" };
  activate.click();
  await new Promise((resolve) => setTimeout(resolve, 3200));

  const readStatus = () =>
    [...section.querySelectorAll("div")]
      .map((element) => element.textContent.trim())
      .find((text) => /^(Rendering|Paused|Static view)/.test(text)) ?? null;
  const click = (label) =>
    [...section.querySelectorAll("button")]
      .find((button) => button.textContent.trim() === label)
      ?.click();

  const running = readStatus();
  click("Pause");
  await new Promise((resolve) => setTimeout(resolve, 900));
  const paused = readStatus();
  click("Resume");
  await new Promise((resolve) => setTimeout(resolve, 900));
  const resumed = readStatus();
  click("Stop");
  await new Promise((resolve) => setTimeout(resolve, 900));

  return {
    running,
    paused,
    resumed,
    idle: Boolean(section.querySelector('button[aria-label="Activate interactive 3D viewer"]')),
  };
});
report.check("EN: viewer rendering", viewer.running === "Rendering", viewer);
report.check("EN: viewer pauses", viewer.paused?.startsWith("Paused"), viewer.paused);
report.check("EN: viewer resumes", viewer.resumed === "Rendering", viewer.resumed);
report.check("EN: viewer stops", viewer.idle === true, viewer);

const live = await client.evaluate(async () => {
  const cards = [...document.querySelectorAll("[data-live-site]")];
  for (const card of cards) {
    card.scrollIntoView({ block: "center" });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  await new Promise((resolve) => setTimeout(resolve, 9500));
  return cards.map((card) => ({
    name: card.querySelector("h3")?.textContent.trim(),
    label: card.querySelector("[data-live-label]")?.textContent.trim(),
    state: card.dataset.state,
  }));
});
report.check("EN: four live sites", live.length === 4, live.length);
report.check(
  "EN: live sites reachable",
  live.every((site) => site.state === "live" && site.label === "Live"),
  live,
);

await switchLanguage("ES");
const backToEs = await readState();
report.check("ES: switch keeps hash", backToEs.path === "/" && backToEs.hash === "#proyectos", `${backToEs.path}${backToEs.hash}`);
report.check("ES: switch restores navigation", same(backToEs.nav, ES_NAV), backToEs.nav);
report.check("ES: switch restores menu label", backToEs.menuLabel === "Abrir menú", backToEs.menuLabel);

await client.navigate(`${BASE}/en/`);
await client.screenshot("qa-desktop-en-hero.png");
await client.navigate(`${BASE}/`);
await client.screenshot("qa-desktop-es-hero.png");

report.check("no uncaught page errors", client.errors.length === 0, client.errors);

report.finish({ base: BASE });
client.close();
