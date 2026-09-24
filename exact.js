const http=require('http');
http.get('http://localhost:5173/admin.html',res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  const lines=d.split("\n");
  // print lines around Tipografia close and Sidebar/SEO boundary
  for(let i=0;i<lines.length;i++){
    if(/data-panel="design"|Sidebar \(Panel|grid2|<!-- SEO -->|data-panel="seo"|class="hint">Las fuentes/.test(lines[i])){
      // print this line and check next few for bare </div>
      let j=i;
      let n=0;
      while(j<lines.length && n<4){
        const ln=lines[j];
        if(ln.trim()==='</div>') console.log('L'+(j+1)+': [BARE </div>]');
        else console.log('L'+(j+1)+': '+ln.trim().slice(0,80));
        if(/<!-- SEO -->/.test(ln)) break;
        j++; n++;
      }
      console.log('----');
    }
  }
});
});
