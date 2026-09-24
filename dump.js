const http=require('http');
http.get('http://localhost:5173/admin.html',res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  const start=d.indexOf('data-panel="design"');
  const end=d.indexOf('<!-- SEO -->')+20;
  const seg=d.slice(start,end);
  const lines=seg.split("\n");
  lines.forEach((l,i)=>{ if(/<\/?div|SEO|data-panel/.test(l)) console.log((i+1).toString().padStart(3,' ')+': '+l.trim().slice(0,90)); });
  console.log('--- count <div in seg:', (seg.match(/<div\b/g)||[]).length, ' </div>:', (seg.match(/<\/div>/g)||[]).length);
});
});
