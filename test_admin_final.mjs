export default async function run(page, ui){
  // Wait for load
  await page.waitForTimeout(1500);
  // Click gamedev tab
  const tabs = await ui.snapshot();
  const btn = tabs.match(/@(e\d+) button "3D & Videojuegos"/)?.[1];
  if(!btn) return {error: 'no button'};
  await ui.click('@'+btn);
  await page.waitForTimeout(1000);
  const heroTag = await page.evaluate(()=> document.getElementById('t3d_hero_tag')?.value || 'empty');
  const heroTitle = await page.evaluate(()=> document.getElementById('t3d_hero_title')?.value?.slice(0,30) || 'empty');
  const workCount = await page.evaluate(()=> document.querySelectorAll('#t3d_work_list .panel').length);
  const hasThreeD = await page.evaluate(()=> {
    try{
      // Try to get state via global or via fetch
      return document.documentElement.innerHTML.includes('t3d_hero_tag') ? 'hasInput' : 'noInput';
    }catch(e){ return e.message; }
  });
  // Try to directly set and check
  const direct = await page.evaluate(async()=>{
    try{
      const r=await fetch('data/portfolio.json',{cache:'no-store'});
      const j=await r.json();
      return j.threeDPage.hero.tag.slice(0,20);
    }catch(e){ return e.message; }
  });
  return {heroTag: heroTag.slice(0,40), heroTitle, workCount, hasThreeD, direct};
}
