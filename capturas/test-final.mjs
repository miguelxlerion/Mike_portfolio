export default async function run(page, ui) {
  try { await page.waitForTimeout(1000); } catch (e) {}
  return await page.evaluate(() => {
    const hero = document.getElementById('hero');
    return {
      heroHTML: hero ? hero.innerHTML.slice(0, 300) : 'no hero',
      works: Array.from(document.querySelectorAll('#worksList .work')).map(w => ({
        title: w.querySelector('.title')?.textContent?.trim(),
        img: w.querySelector('img')?.src,
        meta: w.querySelector('.meta-r')?.textContent?.trim()
      })),
      featured: Array.from(document.querySelectorAll('#featuredGrid .feat')).map(f => f.querySelector('.label')?.textContent?.trim()),
      manifesto: document.getElementById('manifestoWords')?.textContent?.trim(),
      numbers: Array.from(document.querySelectorAll('#numbersGrid [data-count]')).map(e => e.textContent),
      recognition: Array.from(document.querySelectorAll('#recList .rec')).map(r => r.querySelector('.aw')?.textContent?.trim()),
      services: Array.from(document.querySelectorAll('#servicesTrack .service')).map(s => s.querySelector('h3')?.textContent?.trim())
    };
  });
}