export default async function run(page, ui){
  // Click gamedev tab first
  const tabs = await ui.snapshot();
  const btn = tabs.match(/@(e\d+) button "3D & Videojuegos"/)?.[1];
  if(btn) await ui.click('@'+btn);
  await page.waitForTimeout(800);
  const stateStr = await page.evaluate(()=> {
    try{
      return JSON.stringify(window.state?.threeDPage || window.state?.gamedev || {}, null, 2).slice(0,1500);
    }catch(e){ return e.message; }
  });
  const heroTag = await page.evaluate(()=> document.getElementById('t3d_hero_tag')?.value);
  const hasThreeD = await page.evaluate(()=> !!window.state?.threeDPage);
  const hasGamedev = await page.evaluate(()=> !!window.state?.gamedev);
  const ls = await page.evaluate(()=> localStorage.getItem('pa_state_v1')?.slice(0,500));
  return {hasThreeD, hasGamedev, stateStr: stateStr?.slice(0,800), heroTag, ls: ls?.slice(0,300)};
}
