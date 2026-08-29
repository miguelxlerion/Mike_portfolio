export default async function run(page, ui) {
  // Tool already navigated. Wait for JS to render.
  try { await page.waitForFunction("document.getElementById('worksList') && document.getElementById('worksList').innerHTML.length > 100", { timeout: 8000 }); } catch (e) {}
  await page.waitForTimeout(2000);

  return await page.evaluate(() => {
    const out = {};
    const hero = document.getElementById('hero');
    out.heroHasNombre = hero && hero.innerHTML.includes('Miguel Rodríguez');
    out.heroLen = hero ? hero.innerHTML.length : 'nohERO';
    const wl = document.getElementById('worksList');
    out.worksListCount = wl ? wl.querySelectorAll('.work').length : 'noList';
    const w0 = wl && wl.querySelector('.work .title');
    out.work0Title = w0 ? w0.textContent.trim().slice(0,80) : 'none';
    out.work0Img = wl && wl.querySelector('.work img') ? wl.querySelector('.work img').getAttribute('src') : 'noimg';
    const num = document.getElementById('numbersGrid');
    out.numbersCount = num ? num.querySelectorAll('[data-count]').length : 'noNum';
    out.preloaderDone = document.getElementById('preloader')?.classList?.contains('done');
    out.manifestoWords = document.getElementById('manifestoWords')?.textContent?.length || 0;
    const feat = document.getElementById('featuredGrid');
    out.featuredCount = feat ? feat.querySelectorAll('.feat').length : 'noFeat';
    const rec = document.getElementById('recList');
    out.recognitions = rec ? rec.querySelectorAll('.rec').length : 'noRec';
    const foot = document.getElementById('footer');
    out.footerHasOBRA = foot && foot.innerHTML.includes('OBRA®');
    out.services = document.getElementById('servicesTrack') ? document.getElementById('servicesTrack').querySelectorAll('.service').length : 'noSvc';
    return out;
  });
}
