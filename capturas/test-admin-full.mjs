export default async function run(page, ui) {
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(500);
  
  // Check all tabs exist
  const tabs = await page.evaluate(() => {
    const tabBtns = Array.from(document.querySelectorAll('.admin-tabs button, .tabs button, [role="tab"]'));
    return tabBtns.map(b => b.textContent?.trim()).filter(Boolean);
  });
  
  // Check Trabajos tab
  await page.click('button:has-text("Trabajos")');
  await page.waitForTimeout(300);
  
  const trabajos = await page.evaluate(() => {
    const list = document.querySelector('#jobList, #trabajosList, .jobs-list');
    return list ? list.querySelectorAll('.item, .job-item, li').length : 0;
  });
  
  // Check Trayectoria tab
  await page.click('button:has-text("Trayectoria")');
  await page.waitForTimeout(300);
  
  const trayectoria = await page.evaluate(() => {
    const list = document.querySelector('#trayList, .trayectoria-list');
    return list ? list.querySelectorAll('.item, .tray-item, li').length : 0;
  });
  
  // Check Diseño tab
  await page.click('button:has-text("Dise")');
  await page.waitForTimeout(300);
  
  const diseno = await page.evaluate(() => {
    const inputs = document.querySelectorAll('#designPanel input, #designPanel select, .design-controls input, .design-controls select');
    return Array.from(inputs).map(i => ({id: i.id, type: i.type, value: i.value}));
  });
  
  return { tabs, trabajos, trayectoria, disenoInputs: diseno.length };
}