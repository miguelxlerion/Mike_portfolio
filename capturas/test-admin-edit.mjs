export default async function run(page, ui) {
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(500);
  
  // Test Trabajos tab - try to edit first item
  await page.click('button:has-text("Trabajos")');
  await page.waitForTimeout(300);
  
  const editForm = await page.evaluate(() => {
    const editBtn = document.querySelector('#jobList button[title*="Editar"], #jobList button.edit-btn, .job-item button[title*="Editar"], .item button[title*="Editar"]');
    if (editBtn) editBtn.click();
    const modal = document.querySelector('.modal, .edit-modal, #jobForm, #modal');
    return modal ? modal.innerHTML.slice(0, 1000) : 'no modal';
  });
  
  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal .close, .modal [data-close], .close-btn, .modal-backdrop');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(300);
  
  // Check Trayectoria edit
  await page.click('button:has-text("Mi trayectoria")');
  await page.waitForTimeout(300);
  
  const trayEdit = await page.evaluate(() => {
    const editBtn = document.querySelector('#trayList button[title*="Editar"], #trayList button.edit-btn, .tray-item button[title*="Editar"], .tray-item button[title*="editar"]');
    if (editBtn) editBtn.click();
    const modal = document.querySelector('.modal, .edit-modal, #trayForm, #modal');
    return modal ? modal.innerHTML.slice(0, 1000) : 'no modal';
  });
  
  return { editForm: editForm.slice(0,500), trayEdit: trayEdit.slice(0,500) };
}