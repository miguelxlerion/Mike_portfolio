export default async function run(page, ui) {
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(500);
  
  await page.click('button:has-text("Dise")');
  await page.waitForTimeout(500);
  
  return await page.evaluate(() => {
    const panel = document.querySelector('#designPanel, .design-panel, [data-tab="diseno"]');
    const allInputs = document.querySelectorAll('input, select, textarea');
    return {
      panelHTML: panel ? panel.innerHTML.slice(0, 2000) : 'no panel',
      allInputs: Array.from(allInputs).map(i => ({id: i.id, name: i.name, type: i.type, value: i.value?.slice(0,50)}))
    };
  });
}