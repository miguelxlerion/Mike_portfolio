export default async function run(page, ui) {
  await page.waitForTimeout(800);

  const before = await page.evaluate(() => {
    const seo = document.querySelector('[data-panel="seo"]');
    return { seoParent: seo.parentElement.className.toString().slice(0,20), seoHidden: seo.classList.contains('hidden') };
  });

  await page.click('button[data-tab="seo"]');
  await page.waitForTimeout(300);
  const seo = await page.locator('[data-panel="seo"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), hidden: el.classList.contains('hidden'), visible: el.offsetParent !== null };
  });

  await page.click('button[data-tab="publish"]');
  await page.waitForTimeout(300);
  const pub = await page.locator('[data-panel="publish"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), hidden: el.classList.contains('hidden'), visible: el.offsetParent !== null };
  });

  await page.click('button[data-tab="design"]');
  await page.waitForTimeout(300);
  const des = await page.locator('[data-panel="design"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), hidden: el.classList.contains('hidden') };
  });

  await page.click('button[data-tab="dash"]');
  await page.waitForTimeout(200);
  const dashVisible = await page.locator('[data-panel="dash"]').evaluate(el => el.offsetParent !== null);

  return { before, seo, pub, des, dashVisible };
}
