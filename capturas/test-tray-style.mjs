export default async function run(page, ui) {
  try { await page.waitForTimeout(1500); } catch (e) {}
  return await page.evaluate(() => {
    const title = document.querySelector('#recList .rec .aw');
    if (!title) return { error: 'no title found' };
    const style = window.getComputedStyle(title);
    const rec = document.querySelector('#recList .rec');
    const recStyle = rec ? window.getComputedStyle(rec) : {};
    return {
      titleFontFamily: style.fontFamily,
      titleColor: style.color,
      recBackground: recStyle.backgroundColor,
      recBorder: recStyle.borderColor,
      recRadius: recStyle.borderRadius,
      recCount: document.querySelectorAll('#recList .rec').length
    };
  });
}