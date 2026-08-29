export default async function run(page, ui) {
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(500);
  
  await page.click('button:has-text("Dise")');
  await page.waitForTimeout(500);
  
  return await page.evaluate(() => {
    // Check for Trayectoria design controls
    const traySection = document.querySelector('[data-section="trayectoria"], .trayectoria-design, #trayDesignControls');
    const allLabels = Array.from(document.querySelectorAll('label')).map(l => l.textContent?.trim()).filter(Boolean);
    return {
      traySection: traySection ? traySection.innerHTML.slice(0, 2000) : 'NOT FOUND',
      allLabels: allLabels
    };
  });
}