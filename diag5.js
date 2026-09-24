export default async function run(page, ui) {
  await page.waitForTimeout(800);
  const res = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-panel]')];
    return all.map(el => {
      const p = el.parentElement;
      return {
        panel: el.getAttribute('data-panel'),
        selfClass: el.className.toString().slice(0,20),
        parentClass: p ? p.className.toString().slice(0,30) : 'none',
        parentTag: p ? p.tagName : 'none',
        hidden: el.classList.contains('hidden')
      };
    });
  });
  return res;
}
