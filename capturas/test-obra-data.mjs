export default async function run(page, ui) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const result = await page.evaluate(() => {
    // Check if DATA is loaded
    return {
      DATAtype: typeof DATA,
      DATAkeys: typeof DATA === 'object' ? Object.keys(DATA) : [],
      trabajos: Array.isArray((typeof DATA === 'object' && DATA.trabajos)) ? DATA.trabajos.slice(0, 2).map(j => ({titulo: j.titulo, area: j.area, anio: j.anio, img0: (j.imagenes||[])[0]})) : 'not array',
      areas: Array.isArray((typeof DATA === 'object' && DATA.areas)) ? DATA.areas.map(a => ({id: a.id, nombre: a.nombre, color: a.color})) : 'not array',
      inlineScriptCount: document.querySelectorAll('script').length
    };
  });
  return result;
}