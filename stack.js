const http=require('http');
http.get('http://localhost:5173/admin.html',res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  // simple stack trace of divs, track when we enter/leave data-panel=seo
  const re=/<div\b([^>]*)>|<\/div>/g; let m; const stack=[]; let log=[];
  while((m=re.exec(d))){
    if(m[0]==='</div>'){ const top=stack.pop(); if(!top) log.push('UNMATCHED CLOSE'); }
    else { const cls=(m[1].match(/class="([^"]*)"/)||[])[1]||''; const dp=(m[1].match(/data-panel="([^"]*)"/)||[])[1]||''; stack.push({cls,dp}); }
    if(stack.length && stack[stack.length-1].dp==='seo'){
      // print stack when seo is top
    }
  }
  // Re-trace and print stack right before <!-- SEO -->
  const idx=d.indexOf('<!-- SEO -->');
  const seg=d.slice(0,idx);
  let s=[]; const re2=/<div\b([^>]*)>|<\/div>/g; let mm;
  while((mm=re2.exec(seg))){
    if(mm[0]==='</div>') s.pop();
    else { const cls=(mm[1].match(/class="([^"]*)"/)||[])[1]||''; const dp=(mm[1].match(/data-panel="([^"]*)"/)||[])[1]||''; s.push((dp?('['+dp+']'):'')+cls); }
  }
  console.log('Stack before SEO:', JSON.stringify(s));
  console.log('Total <div:', (d.match(/<div\b/g)||[]).length, ' </div>:', (d.match(/<\/div>/g)||[]).length);
});
});
