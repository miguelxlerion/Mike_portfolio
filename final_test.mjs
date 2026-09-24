export default async function run(page, ui){
  await page.goto('http://localhost:5173/admin.html');
  await page.waitForTimeout(1000);
  await page.evaluate(()=> document.getElementById('pinInput').value='1234');
  await page.click('#pinBtn');
  await page.waitForTimeout(1500);
  
  // Test design tab
  await page.evaluate(()=> document.querySelector('[data-tab="design"]').click());
  await page.waitForTimeout(500);
  
  // Test color change
  await page.evaluate(()=>{
    const set = (id,val)=>{
      const el=document.getElementById(id);
      if(el){ el.value=val; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));}
      const hex=document.getElementById(id+'_hex');
      if(hex){ hex.value=val; hex.dispatchEvent(new Event('input',{bubbles:true}));}
    };
    set('d_bg','#00ff00');
    set('d_bg2','#00ffff');
    set('d_text','#ff0000');
    set('d_accent','#ffff00');
    set('d_accent_emerald','#ff00ff');
  });
  await page.waitForTimeout(300);
  
  // Save
  await page.evaluate(()=> document.getElementById('saveAllBtn').click());
  await page.waitForTimeout(1500);
  
  const msg = await page.evaluate(()=> document.getElementById('designMsg')?.textContent);
  const data = await page.evaluate(async ()=>{
    const r=await fetch('data/portfolio.json',{cache:'no-store'});
    const j=await r.json();
    return {bg: j.design?.bg, bg2: j.design?.bg2, texto: j.design?.texto, accent: j.design?.accent, accent_emerald: j.design?.accent_emerald};
  });
  
  await page.goto('http://localhost:5173/index.html');
  await page.waitForTimeout(1500);
  const indexCheck = await page.evaluate(()=>{
    const s=getComputedStyle(document.documentElement);
    return {bgVar: s.getPropertyValue('--bg-primary').trim(), bg2Var: s.getPropertyValue('--bg-secondary').trim(), inkVar: s.getPropertyValue('--text-primary').trim()};
  });
  return {msg, data, indexCheck};
}