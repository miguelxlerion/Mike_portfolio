export default async function({ page }) {
  // Go to admin and unlock
  await page.goto('http://localhost:5173/admin.html');
  await page.waitForTimeout(500);
  
  // Enter PIN
  await page.fill('#pinInput', '1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  
  // Click on Diseño tab
  await page.click('[data-tab="diseno"]');
  await page.waitForTimeout(500);
  
  // Check if d_trayList exists and has content
  const trayList = await page.$('#d_trayList');
  console.log('d_trayList exists:', !!trayList);
  
  if (trayList) {
    const html = await trayList.innerHTML();
    console.log('d_trayList HTML length:', html.length);
    console.log('d_trayList HTML preview:', html.substring(0, 200));
  }
  
  // Check for edit buttons
  const editBtns = await page.$$('[data-d-tray-edit]');
  console.log('Edit buttons found:', editBtns.length);
  
  if (editBtns.length > 0) {
    // Try clicking the first one
    await editBtns[0].click();
    await page.waitForTimeout(500);
    
    // Check if form opened
    const form = await page.$('#trayForm');
    const formVisible = form ? await form.isVisible() : false;
    console.log('trayForm visible after click:', formVisible);
  }
};