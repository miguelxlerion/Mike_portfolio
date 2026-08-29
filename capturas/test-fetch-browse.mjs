export default async function run(page, ui) {
  try { await page.waitForTimeout(1500); } catch (e) {}
  return await page.evaluate(async () => {
    try {
      const r = await fetch('data/portfolio.json', { cache: 'no-store' });
      const text = await r.text();
      const j = JSON.parse(text);
      return {
        status: r.status,
        ok: r.ok,
        siteNombre: j.site && j.site.nombre,
        trabajosLen: Array.isArray(j.trabajos) ? j.trabajos.length : 'NA',
        trab0: j.trabajos && j.trabajos[0] ? { titulo: j.trabajos[0].titulo, area: j.trabajos[0].area, anio: j.trabajos[0].anio, img0: (j.trabajos[0].imagenes||[])[0] } : 'none',
        areasLen: Array.isArray(j.areas) ? j.areas.length : 'NA',
        area0: j.areas && j.areas[0] ? { id: j.areas[0].id, nombre: j.areas[0].nombre, color: j.areas[0].color } : 'none',
        rawLen: text.length,
        preview: text.slice(0, 200)
      };
    } catch (e) {
      return { err: e.message };
    }
  });
}
