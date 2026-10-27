import { BASE, connect, createReport, sleep } from "./lib.mjs";

const client = await connect();
const report = createReport();

await client.viewport(390, 844, true);
await client.navigate(`${BASE}/?qa=1#proyectos`);

const readState = () =>
  client.evaluate(() => {
    const panel = document.querySelector("#mobile-menu");
    const link = panel?.querySelector("[data-lang-link]");
    return {
      path: location.pathname,
      hash: location.hash,
      lang: document.documentElement.lang,
      menuButtonVisible: Boolean(document.querySelector("[data-menu-button]")?.offsetParent),
      panelHidden: panel?.hidden,
      menuLabel: document.querySelector("[data-menu-label]")?.textContent?.trim(),
      navLabel: panel?.querySelector("nav")?.getAttribute("aria-label"),
      switchHref: link?.getAttribute("data-href"),
      linkText: link?.textContent?.trim(),
      linkVisible: Boolean(link?.offsetParent),
    };
  });

const toggleMenu = async () => {
  await client.evaluate(() => document.querySelector("[data-menu-button]")?.click());
  await sleep(600);
};

const closeMenu = async () => {
  await client.evaluate(() => {
    const panel = document.querySelector("#mobile-menu");
    if (panel && !panel.hidden) document.querySelector("[data-menu-button]")?.click();
  });
  await sleep(400);
};

const initial = await readState();
report.check("mobile ES: route", initial.path === "/" && initial.hash === "#proyectos", `${initial.path}${initial.hash}`);
report.check("mobile ES: html lang", initial.lang === "es", initial.lang);
report.check("mobile ES: menu button visible", initial.menuButtonVisible, initial.menuButtonVisible);
report.check("mobile ES: panel starts closed", initial.panelHidden === true, initial.panelHidden);
report.check("mobile ES: menu label", initial.menuLabel === "Abrir menú", initial.menuLabel);

await toggleMenu();
const openEs = await readState();
report.check("mobile ES: panel opens", openEs.panelHidden === false, openEs.panelHidden);
report.check("mobile ES: close label", openEs.menuLabel === "Cerrar menú", openEs.menuLabel);
report.check("mobile ES: nav label", openEs.navLabel === "Navegación móvil", openEs.navLabel);
report.check("mobile ES: switch visible", openEs.linkVisible && openEs.linkText === "EN", openEs);
report.check("mobile ES: switch target", openEs.switchHref === "/en/", openEs.switchHref);
await client.screenshot("qa-mobile-es-menu.png");

try {
  await client.evaluate(() => document.querySelector("#mobile-menu [data-lang-link]")?.click());
} catch {}
await sleep(2600);
await client.waitFor(() => document.readyState === "complete");

const en = await readState();
report.check("mobile EN: route keeps hash", en.path === "/en/" && en.hash === "#proyectos", `${en.path}${en.hash}`);
report.check("mobile EN: html lang", en.lang === "en", en.lang);
report.check("mobile EN: menu label", en.menuLabel === "Open menu", en.menuLabel);
report.check("mobile EN: panel closed after navigation", en.panelHidden === true, en.panelHidden);

await toggleMenu();
const openEn = await readState();
report.check("mobile EN: close label", openEn.menuLabel === "Close menu", openEn.menuLabel);
report.check("mobile EN: nav label", openEn.navLabel === "Mobile navigation", openEn.navLabel);
report.check("mobile EN: switch visible", openEn.linkVisible && openEn.linkText === "ES", openEn);
report.check("mobile EN: switch target", openEn.switchHref === "/", openEn.switchHref);
await client.screenshot("qa-mobile-en-menu.png");

await closeMenu();
const closed = await readState();
report.check("mobile EN: menu closes", closed.panelHidden === true, closed.panelHidden);

report.check("no uncaught page errors", client.errors.length === 0, client.errors);

report.finish({ base: BASE });
client.close();
