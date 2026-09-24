const http=require('http');
http.get('http://localhost:5173/admin.html?t='+Date.now(),res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{
  // Parse with a real-ish stack, but skip <script> and <style> and <textarea> content
  const re=/<\/(script|style|textarea)>|<(script|style|textarea)\b[^>]*>|<div\b([^>]*)>|<\/div>/gi;
  let m, stack=[], inSpecial=false, specialTag='';
  const issues=[];
  while((m=re.exec(d))){
    const tok=m[0].toLowerCase();
    if(/^<(script|style|textarea)/.test(tok)){ inSpecial=true; specialTag=tok.slice(1).split(/\s|>/)[0]; continue; }
    if(inSpecial){ if(tok==='</'+specialTag+'>'){ inSpecial=false; } continue; }
    if(tok==='</div>'){
      if(stack.length===0){ issues.push('Extra </div> at pos '+m.index); }
      else stack.pop();
    } else if(/^<div/.test(tok)){
      const cls=(m[3]||'').match(/class="([^"]*)"/); const dp=(m[3]||'').match(/data-panel="([^"]*)"/);
      stack.push((dp?('['+dp[1]+']'):'')+(cls?(' '+cls[1]):''));
    }
  }
  console.log('Remaining open divs at EOF:', JSON.stringify(stack));
  console.log('Issues:', JSON.stringify(issues.slice(0,10)));
});
});
