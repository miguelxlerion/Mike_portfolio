export default async function run(page, ui) {
  await page.waitForTimeout(800);

  async function chain(sel) {
    return await page.locator(sel).evaluate(el => {
      let e = el, out = [];
      while (e && e !== document.body) {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        out.push({
          tag: e.tagName,
          cls: e.className.toString().slice(0,40),
          disp: cs.display,
          pos: cs.position,
          w: Math.round(r.width), h: Math.round(r.height),
          hidden: e.classList.contains('hidden')
        });
        e = e.parentElement;
      }
      return out;
    });
  }

  await page.click('button[data-tab="seo"]');
  await page.waitForTimeout(300);
  const seoChain = await chain('[data-panel="seo"]');

  // also check dash while seo active (should be hidden)
  const dashChain = await chain('[data-panel="dash"]');

  return { seoChain, dashHidden: dashChain[0].hidden };
}
