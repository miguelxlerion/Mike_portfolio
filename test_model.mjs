export default async function run(page, ui){
  // Check if model is loaded
  await page.waitForTimeout(2000);
  const logs = await page.evaluate(()=> {
    // Try to get the model from the scene
    // The scene is inside the module, not on window, so we can't access it directly
    // Instead, check if the model file was requested
    return document.documentElement.innerHTML.includes('1788555914687') ? 'hasModelRef' : 'noModelRef';
  });
  // Check network
  const hasCanvas = await page.evaluate(()=> !!document.getElementById('bg-canvas'));
  // Try to get console errors via page.on is not available here, but we can check if the model file was fetched
  const modelUrl = await page.evaluate(()=> fetch('data/portfolio.json').then(r=>r.json()).then(j=>j.threeDPage.background.models[0]?.url || 'noUrl'));
  return {logs, hasCanvas, modelUrl};
}
