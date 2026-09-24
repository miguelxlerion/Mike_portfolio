const http=require('http');
http.get('http://localhost:5173/admin.html?t='+Date.now(),res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  const lines=d.split("\n");
  let seg=lines.slice(159,179).join("\n");  // Tipografia section approx
  const opens=(seg.match(/<div\b/g)||[]).length;
  const closes=(seg.match(/<\/div>/g)||[]).length;
  console.log('Tipografia seg opens/close:', opens, closes, 'imbalance:', opens-closes);
  lines.slice(159,179).forEach((l,i)=>console.log((160+i)+': '+l));
});
});
