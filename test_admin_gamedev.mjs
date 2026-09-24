export default async function run(page, ui){
  // Click the 3D & Videojuegos tab
  const tabs = await ui.snapshot();
  const gamedevBtn = tabs.match(/@(e\d+) button "3D & Videojuegos"/)?.[1];
  if(!gamedevBtn) return {error: 'no gamedev button', tabs};
  await ui.click('@'+gamedevBtn);
  await page.waitForTimeout(500);
  const after = await ui.snapshot({full:true});
  // Check if the panel is visible and has content
  const heroTag = await page.evaluate(()=> document.getElementById('t3d_hero_tag')?.value || 'noVal');
  const heroTitle = await page.evaluate(()=> document.getElementById('t3d_hero_title')?.value?.slice(0,20) || 'noVal');
  const hasHero = await page.evaluate(()=> !!document.getElementById('t3d_hero_tag'));
  const count = await page.evaluate(()=> document.querySelectorAll('#t3d_work_list .panel').length);
  return {hasHero, heroTag: heroTag.slice(0,30), heroTitle, count, after: after.slice(0,500)};
}
