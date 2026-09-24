export default async function run(page, ui) {
  await page.waitForTimeout(800);
  await page.click('button[data-tab="seo"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: "X:/Proyectos/Personal_Web_Portfolio/shot_seo.png", fullPage: true });
  await page.click('button[data-tab="publish"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: "X:/Proyectos/Personal_Web_Portfolio/shot_publish.png", fullPage: true });
  return { done: true };
}
