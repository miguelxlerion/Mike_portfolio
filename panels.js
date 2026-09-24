export default async function run(page, ui) {
  await page.goto('http://localhost:5173/admin.html?z='+Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const res = await page.evaluate(() => {
    return [...document.querySelectorAll('[data-panel]')].map(el => {
      const p = el.parentElement;
      return el.getAttribute('data-panel') + ' -> parent: ' + (p ? (p.className||p.tagName) : 'NONE') + (p && p.getAttribute('data-panel') ? ' #'+p.getAttribute('data-panel') : '');
    });
  });
  return res;
}
