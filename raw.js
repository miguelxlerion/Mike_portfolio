const http=require('http');
http.get('http://localhost:5173/admin.html?t='+Date.now(),res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  const lines=d.split("\n");
  for(let i=238;i<252;i++){
    const ln=lines[i]||'(EOF)';
    console.log((i+1)+': ['+ln+']');
  }
});
});
