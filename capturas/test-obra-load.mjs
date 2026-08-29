export default async function run(page, ui) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const result = await page.evaluate(() => {
    const works = document.getElementById('worksList');
    const tiles = works ? works.querySelectorAll('.work') : [];
    const feats = document.getElementById('featuredGrid') ? document.getElementById('featuredGrid').querySelectorAll('.feat') : [];
    const firstTitle = tiles[0] ? tiles[0].querySelector('.title').textContent : '';
    const preloader = document.getElementById('preloader');
    const preloaderDone = preloader ? preloader.classList.contains('done') : null;
    return {
      works: tiles.length,
      feats: feats.length,
      firstTitle,
      preloaderDone,
      hasAntonFont: document.querySelector('link[href*="anton"]') !== null,
      hasGSAP: typeof gsap !== 'undefined'
    };
  });
  return result;
}