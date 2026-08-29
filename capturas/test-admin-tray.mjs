export default async function run(page, ui) {
  // Login
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(500);
  
  // Check Trayectoria tab
  await page.click('button:has-text("Trayectoria")');
  await page.waitForTimeout(500);
  
  const out = await page.evaluate(() => {
    const list = document.querySelector('#trayList');
    return {
      trayItems: list ? list.querySelectorAll('.tray-item').length : 0,
      trayHTML: list ? list.innerHTML.slice(0, 500) : 'none'
    };
  });
  
  return out;
}