export default async function run(page, ui) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  return await page.evaluate(() => {
    const w = document.querySelector('.work');
    const full = w ? w.innerHTML : 'NO WORK ELEMENT';
    const titleEl = w ? w.querySelector('.title') : null;
    // check script tags
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline');
    return { fullHTML: full.slice(0, 500), titleText: titleEl ? titleEl.textContent : 'null', scripts };
  });
}