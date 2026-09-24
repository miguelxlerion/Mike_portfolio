export default async function run(page, ui) {
  await page.goto('http://localhost:5173/admin.html?q='+Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const res = await page.evaluate(() => {
    const design = document.querySelector('[data-panel="design"]');
    const html = design.innerHTML;
    const opens = (html.match(/<div\b/g)||[]).length;
    const closes = (html.match(/<\/div>/g)||[]).length;
    // list direct children tags
    const kids = [...design.children].map(c=>c.tagName+'.'+(c.className||'')+(c.getAttribute('data-panel')?'#'+c.getAttribute('data-panel'):''));
    return { opens, closes, imbalance: opens-closes, childCount: design.children.length, kids };
  });
  return res;
}
