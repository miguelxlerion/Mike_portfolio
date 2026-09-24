export default async function run(page, ui) {
  await page.waitForTimeout(800);
  const chain = await page.evaluate(() => {
    const seo = document.querySelector('[data-panel="seo"]');
    let e = seo, out = [];
    while (e && out.length < 8) {
      out.push(e.tagName + '.' + e.className.toString().replace(/\s+/g,'.').slice(0,25) + (e.id?'#'+e.id:''));
      e = e.parentElement;
    }
    return { chain: out, designH: Math.round(document.querySelector('[data-panel="design"]').getBoundingClientRect().height) };
  });
  return chain;
}
