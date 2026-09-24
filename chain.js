export default async function run(page, ui) {
  await page.goto('http://localhost:5173/admin.html?v='+Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const chain = await page.evaluate(() => {
    const seo = document.querySelector('[data-panel="seo"]');
    let e = seo, out = [];
    while (e && out.length < 8) {
      out.push(e.tagName + (e.className?('.'+e.className.toString().replace(/\s+/g,'.')):'') + (e.getAttribute('data-panel')?('#'+e.getAttribute('data-panel')):''));
      e = e.parentElement;
    }
    return { chain: out, designIsInChain: out.some(c=>c.includes('design')) };
  });
  return chain;
}
