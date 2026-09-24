export default async function run(page, ui){
  await page.waitForTimeout(2500);
  const hasState = await page.evaluate(()=> !!window.state);
  const keys = await page.evaluate(()=> window.state ? Object.keys(window.state).join(',') : 'noState');
  const threeD = await page.evaluate(()=> window.state?.threeDPage ? 'hasThreeD' : 'noThreeD');
  const heroTag = await page.evaluate(()=> document.getElementById('t3d_hero_tag')?.value?.slice(0,30) || 'empty');
  // Try to click gamedev tab
  const tabs = await ui.snapshot();
  const btn = tabs.match(/@(e\d+) button "3D & Videojuegos"/)?.[1];
  if(btn){
    await ui.click('@'+btn);
    await page.waitForTimeout(800);
    const afterClick = await page.evaluate(()=> document.getElementById('t3d_hero_tag')?.value?.slice(0,30) || 'emptyAfter');
    return {hasState, keys: keys.slice(0,100), threeD, heroTag, afterClick};
  }
  return {hasState, keys, threeD, heroTag};
}
