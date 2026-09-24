export default async function run(page, ui) {
  await page.waitForTimeout(800);
  await page.click('button[data-tab="seo"]');
  await page.waitForTimeout(400);

  const info = await page.locator('[data-panel="seo"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      innerText: el.innerText.slice(0, 200),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      display: cs.display,
      hidden: el.classList.contains('hidden')
    };
  });

  const viewport = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, scrollY: window.scrollY }));
  const contentBox = await page.locator('.content').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });

  return { info, viewport, contentBox };
}
