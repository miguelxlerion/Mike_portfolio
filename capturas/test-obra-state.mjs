export default async function run(page, ui) {
  // Tool already navigated to the URL. Wait for content.
  try { await page.waitForSelector('#works', { timeout: 5000 }); } catch (e) {}
  try { await page.waitForFunction("typeof gsap !== 'undefined'", { timeout: 8000 }); } catch (e) {}
  await page.waitForTimeout(1500);

  return await page.evaluate(() => {
    const logs = [];
    try { logs.push('typeof DATA=' + typeof DATA); } catch (e) { logs.push('DATA access err:' + e.message); }
    try { logs.push('window.__PORTFOLIO__=' + typeof window.__PORTFOLIO__); } catch (e) {}
    try { logs.push('typeof init=' + typeof init); } catch (e) {}
    try { logs.push('typeof loadData=' + typeof loadData); } catch (e) {}
    try { logs.push('typeof gsap=' + typeof gsap); } catch (e) {}
    try { logs.push('typeof startAnimations=' + typeof startAnimations); } catch (e) {}
    try { logs.push('typeof initGSAP=' + typeof initGSAP); } catch (e) {}
    try { logs.push('preloader class=' + document.getElementById('preloader')?.className); } catch (e) {}
    try { logs.push('works count=' + document.querySelectorAll('#works .work').length); } catch (e) {}
    try { logs.push('hero innerHTML len=' + (document.getElementById('hero')?.innerHTML||'').length); } catch (e) {}
    const w0 = document.querySelector('#works .work');
    try { logs.push('work0 title=' + w0?.querySelector('.title')?.textContent?.trim().slice(0, 80)); } catch (e) {}
    try { logs.push('work0 meta=' + w0?.querySelector('.meta-r')?.textContent?.trim().slice(0, 80)); } catch (e) {}
    return { logs: logs.join('\n') };
  });
}
