const http=require('http');
http.get('http://localhost:5173/admin.html',res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  const lines=d.split("\n");
  const re=/<div\b([^>]*)>|<\/div>/g; 
  // find line index of design open and SEO comment
  let designLine=-1, seoLine=-1;
  lines.forEach((l,i)=>{ if(l.includes('data-panel="design"')) designLine=i; if(l.includes('<!-- SEO -->')) seoLine=i; });
  console.log('designLine',designLine,'seoLine',seoLine);
  let stack=[];
  for(let i=designLine;i<=seoLine;i++){
    let mm; const lineRe=/<div\b([^>]*)>|<\/div>/g;
    while((mm=lineRe.exec(lines[i]))){
      if(mm[0]==='</div>'){ if(stack.length) stack.pop(); else console.log('  L'+(i+1)+' UNMATCHED CLOSE'); }
      else { const cls=(mm[1].match(/class="([^"]*)"/)||[])[1]||''; const dp=(mm[1].match(/data-panel="([^"]*)"/)||[])[1]||''; stack.push((dp?('['+dp+']'):'')+(cls?' '+cls:'')); }
    }
    if(i===designLine || i===seoLine || lines[i].includes('</div>') && (stack.length<=4))
      console.log('L'+(i+1)+' after: ['+stack.join(' | ')+']');
  }
});
});
