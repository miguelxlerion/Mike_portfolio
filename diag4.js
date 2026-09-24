export default async function run(page, ui) {
  await page.waitForTimeout(800);
  await page.click('button[data-tab="seo"]');
  await page.waitForTimeout(300);

  const res = await page.locator('[data-panel="seo"]').evaluate(el => {
    const p1 = el.parentElement;
    const p2 = p1 ? p1.parentElement : null;
    const p3 = p2 ? p2.parentElement : null;
    const info = e => e ? `${e.tagName}.${e.className.toString().slice(0,30)} [disp=${getComputedStyle(e).display}]` : 'null';
    return {
      self: info(el),
      p1: info(p1),
      p2: info(p2),
      p3: info(p3),
      p1html: p1 ? p1.outerHTML.slice(0,120) : ''
    };
  });
  return res;
}
