const http=require('http');
http.get('http://localhost:5173/admin.html?t='+Date.now(),res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  for(const pos of [31827,32078]){
    console.log('=== Around pos '+pos+' ===');
    console.log(d.slice(pos-120, pos+40).replace(/\n/g,'\\n'));
    console.log('');
  }
  // Also find design open position
  const di=d.indexOf('data-panel="design"');
  console.log('design open at pos', di);
});
});
