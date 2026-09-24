const http=require('http');
http.get('http://localhost:5173/admin.html',res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  const re=/<div\b([^>]*)>|<\/div>/g; let m; const stack=[]; let seoParentBefore=null;
  while((m=re.exec(d))){
    if(m[0]==='</div>'){ if(stack.length) stack.pop(); }
    else { const cls=(m[1].match(/class="([^"]*)"/)||[])[1]||''; const dp=(m[1].match(/data-panel="([^"]*)"/)||[])[1]||''; stack.push((dp?('['+dp+']'):'')+(cls?' '+cls:'')); }
    if(stack.length && stack[stack.length-1].includes('[seo]')) seoParentBefore = stack[stack.length-2]||'NONE';
  }
  console.log('Final stack:', JSON.stringify(stack));
  console.log('Total <div:', (d.match(/<div\b/g)||[]).length, ' </div>:', (d.match(/<\/div>/g)||[]).length);
});
});
