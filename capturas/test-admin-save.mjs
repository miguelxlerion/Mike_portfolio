export default async function run(page, ui) {
  // Login to admin
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(500);
  
  // Go to Diseño tab
  await page.click('button:has-text("Dise")');
  await page.waitForTimeout(500);
  
  // Change Trayectoria accent color
  await page.evaluate(() => {
    const input = document.getElementById('d_tray_accent');
    if (input) {
      input.value = '#ff0000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const hex = document.getElementById('d_tray_accent_hex');
    if (hex) {
      hex.value = '#ff0000';
      hex.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);
  
  // Click save
  await page.click('#saveDesignBtn');
  await page.waitForTimeout(1500);
  
  // Check message
  const msg = await page.evaluate(() => document.getElementById('designMsg')?.textContent);
  
  return { saveMessage: msg };
}