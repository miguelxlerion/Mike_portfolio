export default async function run(page, ui) {
  await page.goto('http://localhost:5173/admin.html?w='+Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const res = await page.evaluate(() => {
    const design = document.querySelector('[data-panel="design"]');
    const panels = [...design.querySelectorAll(':scope > .panel, :scope > [data-panel]')];
    const report = panels.map(p => {
      const h3 = p.querySelector('h3');
      return (h3?h3.textContent.slice(0,20):'?') + ' -> parent: ' + (p.parentElement.getAttribute('data-panel')||p.parentElement.className);
    });
    // Also: parent of each sub-panel by checking direct children of Tipografia
    const tipo = [...design.children].find(c=>c.querySelector('h3')&&c.querySelector('h3').textContent.includes('Tipograf'));
    const tipoKids = tipo ? [...tipo.children].map(k => k.tagName+'.'+(k.className||'')+(k.querySelector('h3')?('#'+k.querySelector('h3').textContent.slice(0,15)):'')) : [];
    return { report, tipoKids };
  });
  return res;
}
