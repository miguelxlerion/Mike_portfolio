export default async function run(page) {
  try { await page.waitForTimeout(1000); } catch(e) {}
  // Login
  await page.fill('#pinInput', '1234');
  await page.click('#enterBtn');
  await page.waitForTimeout(1500);
  // Click design tab
  const designBtn = await page.$('[data-show-panel="diseno"]');
  if (designBtn) await designBtn.click();
  await page.waitForTimeout(500);
  // Check design inputs
  return await page.evaluate(() => {
    const ids = ['d_bg','d_bg_hex','d_bg2','d_bg2_hex','d_texto','d_texto_hex','d_accent','d_accent_hex','d_muted','d_muted_hex','d_line','d_line_hex'];
    const result = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) result[id] = el.value;
    });
    return result;
  });
}