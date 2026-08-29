export default async function run(page, ui) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const result = await page.evaluate(() => {
    const w = document.querySelector('.work');
    const t = w ? w.querySelector('.title') : null;
    const items = document.querySelectorAll('.work').length;
    const feats = document.querySelectorAll('.feat').length;
    const preloaderDone = document.getElementById('preloader') ? document.getElementById('preloader').classList.contains('done') : null;
    const gsapLoaded = typeof gsap !== 'undefined';
    const scrolltrigger = typeof ScrollTrigger !== 'undefined';
    // Get raw HTML of first work title element
    const titleHtml = t ? t.outerHTML.slice(0, 200) : 'null';
    return { items, feats, titleHtml, preloaderDone, gsapLoaded, scrolltrigger };
  });
  return result;
}