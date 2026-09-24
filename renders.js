// renders.js — vanilla port of Render3DWeb Experience + MapStage + Loader + PinDetail + Voices + CMS
const HINTS = ["click and drag to explore","scroll to zoom in & out","click on the pins to learn more"];
const MIN_SCALE=1, MAX_SCALE=4.2;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function hexA(hex,alpha){
  const h=String(hex||'').replace('#','');
  const f=h.length===3 ? h.split('').map(c=>c+c).join('') : h.padEnd(6,'0').slice(0,6);
  const r=parseInt(f.slice(0,2),16), g=parseInt(f.slice(2,4),16), b=parseInt(f.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function ytEmbed(url){
  const u=String(url||'').trim(); if(!u) return '';
  let m=u.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if(m) return 'https://www.youtube.com/embed/'+m[1];
  if(/^https?:\/\//.test(u)) return u;
  return '';
}
const componentFonts={mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',sans:'Inter,system-ui,sans-serif',display:'"Playfair Display",Georgia,serif'};
function fontFor(value,fallback){ const aliases={mono:componentFonts.mono,sans:componentFonts.sans,display:componentFonts.display}; const family=value||fallback; if(aliases[family]) return aliases[family]; if(family==='custom') return aliases.sans; const id='renders-font-'+family.toLowerCase().replace(/[^a-z0-9]+/g,'-'); if(!document.getElementById(id)){ const link=document.createElement('link'); link.id=id; link.rel='stylesheet'; link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(family).replace(/%20/g,'+')+':wght@300;400;500;600;700;800&display=swap'; document.head.appendChild(link); } return `'${family}', sans-serif`; }

let pins=[], voices=[], visits=12840, activeId=null, overlay=null, indexOpen=false, placing=false, coords=null, hint=0, entered=false;
let RS=null;
let view={scale:1.25,x:0,y:0}, animate=true, size={w:0,h:0,s:0};
let audioEnabled=false, audioCtx=null, audioNodes=null;
const stage = { focusPin:()=>{}, reset:()=>{} };
function renameBrand(value){
  if(typeof value==='string') return value.replace(/zacamil/gi,'Xlerion');
  if(Array.isArray(value)) return value.map(renameBrand);
  if(value && typeof value==='object') Object.keys(value).forEach(k=>{ value[k]=renameBrand(value[k]); });
  return value;
}

// DOM refs assigned on init
let $mapStage,$mapInner,$pinsLayer,$zoomLabel,$topBar,$hintWrap,$hintText,$bottomIndex,$indexCount,$indexToggle,$indexPanel,$indexStrip,$pinDetail,$pinImage,$pinAccent,$pinDot,$pinMeta,$pinTitle,$pinSubtitle,$pinBody,$pinQuoteWrap,$pinQuote,$pinQuoteAuthor,$pinCount,$loader,$loaderBar,$loaderPct,$loaderVisits,$enterBtn,$soundToggle,$soundLabel,$soundBtn,$placingHint;

const seedPins=[
  {id:1,slug:"la-abuela",number:1,title:"La Abuela",subtitle:"Block C — north facade",artist:"Roque Espinoza",category:"mural",year:"2024",accent:"#E4572E",x:26,y:31,imageUrl:"images/p1.jpg",body:"Four storeys of raw concrete turned into a portrait of the women who arrived here in the seventies, carrying the countryside in their suitcases.",quote:"We did not want a decoration. We wanted the building to look back at us.",quoteAuthor:"Roque Espinoza, painter"},
  {id:2,slug:"escalera-geometrica",number:2,title:"Escalera Geométrica",subtitle:"Stairwell 14, passage to the market",artist:"Matteo Negri",category:"intervention",year:"2025",accent:"#1D7874",x:48,y:22,imageUrl:"images/p2.jpg",body:"For years this passage was a place you crossed quickly and without looking up. Teal, coral and a hard yellow now bend around the handrails.",quote:"Colour is the cheapest form of street lighting.",quoteAuthor:"Neighbourhood assembly, Sector 2"},
  {id:3,slug:"la-cancha",number:3,title:"La Cancha",subtitle:"Community court, central square",artist:"Collective work — 60 residents",category:"public space",year:"2025",accent:"#E8A33D",x:62,y:55,imageUrl:"images/p3.jpg",body:"The concrete court sat empty for the best part of a decade. It was repaired, repainted and given back in a single weekend of communal work.",quote:"Ours again, and this time in daylight.",quoteAuthor:"Marisol, resident since 1979"},
  {id:4,slug:"raices",number:4,title:"Raíces",subtitle:"Block H — west gable",artist:"Beatrice Vigoni",category:"mural",year:"2024",accent:"#5B8C5A",x:34,y:68,imageUrl:"images/p4.jpg",body:"Maize, ceiba leaves and two volcanoes, painted in indigo and deep green over a wall that had been grey since it was poured.",quote:"The wall already had a drawing. We only followed it.",quoteAuthor:"Beatrice Vigoni, artist"},
  {id:5,slug:"el-mirador",number:5,title:"El Mirador",subtitle:"Rooftop, Block A",artist:"Adriano Lombardo",category:"light",year:"2025",accent:"#B6465F",x:74,y:34,imageUrl:"images/p5.jpg",body:"A low line of warm lamps installed along the highest roof of the superblock.",quote:"From the bus you can finally see where you live.",quoteAuthor:"Kevin, 17"},
  {id:6,slug:"la-tienda",number:6,title:"La Tienda de Doña Chepi",subtitle:"Ground floor, Block D",artist:"Giuseppe De Mattia",category:"archive",year:"2025",accent:"#E4572E",x:54,y:78,imageUrl:"images/p6.jpg",body:"A corner shop that closed under extortion and reopened in 2025. Its shutter now carries a photographic archive printed directly on metal.",quote:"Everyone came to see if their grandmother made it onto the door.",quoteAuthor:"Doña Chepi, shopkeeper"},
  {id:7,slug:"pasaje-del-agua",number:7,title:"Pasaje del Agua",subtitle:"Alley between Blocks E and F",artist:"Satoshi Gallery",category:"intervention",year:"2026",accent:"#2F6690",x:18,y:52,imageUrl:"images/documentacion-parallax.jpg",body:"Painted gutters and blue mosaic run the length of the alley.",quote:"In October the painting starts to flow.",quoteAuthor:"Field notes, Sector 4"},
  {id:8,slug:"memoria",number:8,title:"Memoria",subtitle:"Wall of the old health post",artist:"Andrea Ravo Mattoni",category:"memory",year:"2026",accent:"#8C6A5D",x:84,y:66,imageUrl:"images/Oficina0013.jpg",body:"The quietest wall of the colonia. A classical composition repainted at 1:1 scale.",quote:"Some walls are for looking at in silence.",quoteAuthor:"Custodians of the wall"},
];
const seedVoices=[
  {id:1,name:"Marisol",place:"Xlerion, Sector 2",message:"I have lived under this staircase for forty-six years. It is the first time someone paints it instead of writing on it."},
  {id:2,name:"Tobias",place:"Berlin",message:"Found this at 2am and flew over the whole map twice. Sound on is the right way."},
  {id:3,name:"Ana Lucía",place:"San Salvador",message:"My mother grew up in Block D. I sent her pin number 6 and she cried."},
];

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

const BTN_FONTS={
  mono:"ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
  display:"'Playfair Display',Georgia,serif",
  sans:"Inter,system-ui,sans-serif"
};
function submitBtnStyle(){
  const st=RS?.styles||{};
  const paper=RS?.colors?.paper||'#f4efe6';
  const text=st.btnTextColor||'#f4efe6';
  const border=st.btnBorderColor||'#f4efe6';
  let bg='transparent';
  if(st.btnBg==='paper10') bg=hexA(paper,.1);
  else if(st.btnBg==='paper25') bg=hexA(paper,.25);
  return `color:${text};border-color:${hexA(border,.5)};background:${bg};font-family:${BTN_FONTS[st.btnFont]||BTN_FONTS.mono};font-size:${st.btnSize||'11px'}`;
}
function submitBtnFill(){
  const st=RS?.styles||{};
  const cls=st.btnFill||'absolute inset-0 origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500';
  const col=st.btnFillColor||RS?.colors?.clay||'#E4572E';
  return `<span class="${cls}" style="background:${col}"></span>`;
}
function submitBtnIcon(){
  const st=RS?.styles||{};
  if(!st.btnIcon) return {left:'',right:''};
  const ic=`<span aria-hidden="true">${st.btnIcon}</span>`;
  return st.btnIconPos==='right' ? {left:'',right:ic} : {left:ic,right:''};
}

async function loadData(){
  // live preview from admin localStorage
  let localSettings=null;
  try{
    const ls=localStorage.getItem('portfolio')||localStorage.getItem('portfolio.json')||localStorage.getItem('pa_portfolio')||localStorage.getItem('pa_state_v1');
    if(ls){
      const d=JSON.parse(ls);
      if(d.renders){
        d.renders=renameBrand(d.renders);
        if(Array.isArray(d.renders.pins)&&d.renders.pins.length) pins=d.renders.pins;
        if(Array.isArray(d.renders.voices)) voices=d.renders.voices;
        if(typeof d.renders.visits==='number') visits=d.renders.visits;
        if(d.renders.settings){ localSettings=d.renders.settings; RS=localSettings; }
      }
    }
  }catch{}
  try{
    const r=await fetch('data/portfolio.json',{cache:'no-store'});
    if(r.ok){
      const d=await r.json();
      const rp=d.renders?.pins;
      const rv=d.renders?.voices;
      const rc=d.renders?.visits;
      if(Array.isArray(rp)&&rp.length) pins=rp;
      else if(!pins.length) pins=seedPins;
      if(Array.isArray(rv)) voices=rv; else if(!voices.length) voices=seedVoices;
      if(typeof rc==='number') visits=rc;
      if(d.renders?.settings && !localSettings) RS=renameBrand(d.renders.settings);
      // also allow gallery3d fallback
      if(!d.renders && d.gallery3d?.projects?.length && !pins.length){
        pins=d.gallery3d.projects.map((p,i)=>({id:i+1,slug:p.id||('pin-'+(i+1)),number:i+1,title:p.title,subtitle:p.tagline||'',artist:p.artist||p.role||'',category:p.kind||p.category||'mural',year:p.year||'',body:p.description||p.body||'',quote:p.quote||'',quoteAuthor:p.quoteAuthor||'',imageUrl:p.imageUrl||p.image||'images/p1.jpg',accent:p.accent||'#E4572E',x:p.x||20+Math.random()*60,y:p.y||20+Math.random()*60}));
      }
      return;
    }
  }catch{}
  if(!pins.length) pins=seedPins;
  if(!voices.length) voices=seedVoices;
}

function applyRendersSettings(remote){
  const s=remote || RS || window.__rendersSettings; if(!s) return;
  RS=s; window.__rendersSettings=s;
  const q=(sel)=>document.querySelector(sel);
  const text=(el,txt)=>{ if(el && txt!==undefined && txt!==null) el.textContent=txt; };
  // header
  text(q('#logoBtn .display'), s.headerTitle);
  text(q('#logoBtn .mono'), s.headerSubtitle);
  document.querySelectorAll('[data-overlay]').forEach(b=>{
    if(b.dataset.overlay==='about' && s.navAbout!==undefined) b.textContent=s.navAbout;
    if(b.dataset.overlay==='voices' && s.navVoices!==undefined) b.textContent=s.navVoices;
    if(b.dataset.overlay==='cms' && s.navCms!==undefined) b.textContent=s.navCms;
  });
  text(document.getElementById('soundLabel'), audioEnabled ? (s.soundOn||'sound on') : (s.soundOff||'sound off'));
  text(document.getElementById('soundToggleLabel'), audioEnabled ? (s.soundOn||'sound on') : (s.soundOff||'sound off'));
  // loader
  if(s.loaderTitle) text(q('#loader h1'), s.loaderTitle);
  text(document.getElementById('loaderDesc'), s.loaderDesc);
  text(document.getElementById('loaderFlyTo'), s.loaderFlyTo);
  text(document.getElementById('loaderLoading'), s.loaderLoading);
  text(document.getElementById('loaderCoords'), s.loaderCoords);
  text(document.getElementById('loaderLocation'), s.loaderLocation);
  text(document.getElementById('loaderVisitsSuffix'), s.loaderVisitsSuffix);
  text(document.getElementById('loaderPowered'), s.loaderPowered);
  if(document.getElementById('enterBtn') && s.loaderEnter!==undefined){ const eb=document.getElementById('enterBtn'); const ic=submitBtnIcon(); eb.setAttribute('style',submitBtnStyle()); eb.innerHTML='<span class="relative z-10">'+ic.left+s.loaderEnter+ic.right+'</span>'+submitBtnFill(); }
  if(s.loaderBg){ const el=document.getElementById('loaderBg'); if(el) el.style.backgroundImage="url('"+s.loaderBg+"')"; }
  if(s.mapImage){ const el=document.getElementById('mapBg'); if(el) el.style.backgroundImage="url('"+s.mapImage+"')"; }
  if(s.hints && s.hints.length){ HINTS.length=0; s.hints.forEach(h=>HINTS.push(h)); if($hintText) $hintText.textContent=HINTS[hint%HINTS.length]; }
  window.__indexOpen=s.indexOpen||'open index +'; window.__indexHide=s.indexHide||'hide index −';
  if($indexToggle && !indexOpen) $indexToggle.textContent=window.__indexOpen;
  renderMarquee();
  // about overlay
  text(document.getElementById('aboutLabel'), s.aboutLabel);
  text(document.getElementById('aboutTitle'), s.aboutTitle);
  if(s.aboutStats){ const stats=document.querySelectorAll('#aboutStats > div'); s.aboutStats.forEach((st,i)=>{ if(stats[i]){ const k=stats[i].querySelector('.display'); const v=stats[i].querySelector('.mono'); if(k) k.textContent=st.k; if(v) v.textContent=st.v; } }); }
  if(s.aboutParas){
    text(document.getElementById('aboutPara1'), s.aboutParas[0]);
    text(document.getElementById('aboutPara2'), s.aboutParas[1]);
    text(document.getElementById('aboutPara3'), s.aboutParas[2]);
  }
  if(s.aboutMeta){ const metas=document.querySelectorAll('#aboutMeta > div'); s.aboutMeta.forEach((m,i)=>{ if(metas[i]){ metas[i].innerHTML=m.k+'<br><span> '+m.v+'</span>'; } }); }
  { const wv=document.getElementById('aboutVideoWrap'); const url=ytEmbed(s.aboutVideoUrl);
    if(wv){ if(url){ wv.classList.remove('hidden'); text(document.getElementById('aboutVideoLabel'), s.aboutVideoLabel||'film'); const fr=document.getElementById('aboutVideoFrame'); if(fr && fr.dataset.src!==url){ fr.dataset.src=url; fr.src=url; } }
      else { wv.classList.add('hidden'); const fr=document.getElementById('aboutVideoFrame'); if(fr){ fr.removeAttribute('src'); delete fr.dataset.src; } } } }
  // voices overlay shell
  text(document.getElementById('voicesLabel'), s.voicesLabel);
  text(document.getElementById('voicesTitle'), s.voicesTitle);
  { const wv=document.getElementById('voicesVideoWrap'); const url=ytEmbed(s.voicesVideoUrl);
    if(wv){ if(url){ wv.classList.remove('hidden'); text(document.getElementById('voicesVideoLabel'), s.voicesVideoLabel||'film'); const fr=document.getElementById('voicesVideoFrame'); if(fr && fr.dataset.src!==url){ fr.dataset.src=url; fr.src=url; } }
      else { wv.classList.add('hidden'); const fr=document.getElementById('voicesVideoFrame'); if(fr){ fr.removeAttribute('src'); delete fr.dataset.src; } } } }
  // cms overlay shell
  text(document.getElementById('cmsLabel'), s.cmsLabel);
  text(document.getElementById('cmsTitle'), s.cmsTitle);
  { const wv=document.getElementById('cmsVideoWrap'); const url=ytEmbed(s.cmsVideoUrl);
    if(wv){ if(url){ wv.classList.remove('hidden'); text(document.getElementById('cmsVideoLabel'), s.cmsVideoLabel||'film'); const fr=document.getElementById('cmsVideoFrame'); if(fr && fr.dataset.src!==url){ fr.dataset.src=url; fr.src=url; } }
      else { wv.classList.add('hidden'); const fr=document.getElementById('cmsVideoFrame'); if(fr){ fr.removeAttribute('src'); delete fr.dataset.src; } } } }
  // pinDetail labels
  if(s.pinClose){ const el=document.getElementById('pinClose'); if(el) el.textContent=s.pinClose+' ✕'; }
  // overlay close buttons (about/voices/cms)
  document.querySelectorAll('[data-close-overlay]').forEach(b=>{ if(s.overlayClose!==undefined) b.textContent=s.overlayClose; if(s.styles&&s.styles.overlayCloseItem) b.className=s.styles.overlayCloseItem; });
  if(s.styles&&s.styles.pinCloseItem){ const el=document.getElementById('pinClose'); if(el) el.className=s.styles.pinCloseItem; }
  if(s.pinPrev){ const el=document.getElementById('pinPrev'); if(el) el.textContent='← '+s.pinPrev; }
  if(s.pinNext){ const el=document.getElementById('pinNext'); if(el) el.textContent=s.pinNext+' →'; }
  if(s.placingHint){ const el=document.getElementById('placingHintText'); if(el) el.textContent=s.placingHint; }
    if(s.colors){ applyRendersColors(s.colors); }
    if(s.styles){
      const setStyles=(el,styles)=>{ if(!el) return; Object.entries(styles).forEach(([key,value])=>{ const cssKey=key.replace(/[A-Z]/g,match=>'-'+match.toLowerCase()); el.style.setProperty(cssKey,value,'important'); }); };
      const logo=document.getElementById('logoBtn');
      const logoTitle=logo?.querySelector('.display');
      const logoSub=logo?.querySelector('.mono');
      setStyles(logo,{background:'transparent',border:'0',padding:'0',appearance:'none'});
      setStyles(logoTitle,{fontFamily:fontFor(s.styles.logoFont,'Playfair Display'),fontSize:s.styles.logoSize||'1.5rem',fontWeight:s.styles.logoWeight||'400',color:s.styles.logoColor||RS?.colors?.paper||'#f4efe6'});
      setStyles(logoSub,{fontFamily:fontFor(s.styles.subtitleFont,'JetBrains Mono'),fontSize:s.styles.subtitleSize||'10px',color:s.styles.subtitleColor||RS?.colors?.paper||'#f4efe6'});
      document.querySelectorAll('[data-overlay]').forEach(button=>setStyles(button,{fontFamily:fontFor(s.styles.navFont,'JetBrains Mono'),fontSize:s.styles.navSize||'10px',color:s.styles.navColor||RS?.colors?.paper||'#f4efe6'}));
      const it=document.getElementById('indexToggle');
      if(it){
        setStyles(it,{fontFamily:fontFor(s.styles.indexFont,'JetBrains Mono'),fontSize:s.styles.indexSize||'9px'});
        it.style.setProperty('color',s.styles.indexColor||RS?.colors?.paper||'#f4efe6');
        const tbg=s.styles.indexToggleBg, tbd=s.styles.indexToggleBorder;
        if(tbg&&tbg!=='transparent') it.style.setProperty('background',tbg); else it.style.removeProperty('background');
        if(tbd&&tbd!=='transparent') it.style.setProperty('border-color',tbd); else it.style.removeProperty('border-color');
      }
      setStyles(document.getElementById('indexCount'),{fontFamily:fontFor(s.styles.indexFont,'JetBrains Mono'),fontSize:s.styles.indexSize||'9px',color:s.styles.indexColor||RS?.colors?.paper||'#f4efe6'});
      const zoomWrap=document.getElementById('zoomIn')?.parentElement;
      if(s.styles.zoomPos && zoomWrap) zoomWrap.className=s.styles.zoomPos;
      setStyles(zoomWrap,{background:s.styles.zoomBg||'#0d0c0b',borderColor:hexA(s.styles.zoomBorder||RS?.colors?.paper||'#f4efe6',.2),borderRadius:s.styles.zoomRadius||'999px'});
      ['zoomIn','zoomOut'].forEach(id=>setStyles(document.getElementById(id),{background:'transparent',border:'0',appearance:'none',color:s.styles.zoomColor||RS?.colors?.paper||'#f4efe6'}));
      ['pinPrev','pinCount','pinNext'].forEach(id=>setStyles(document.getElementById(id),{fontFamily:fontFor(s.styles.pinNavFont,'JetBrains Mono'),fontSize:s.styles.pinNavSize||'10px',color:s.styles.pinNavColor||RS?.colors?.paper||'#f4efe6'}));
      setStyles(document.getElementById('pinTitle'),{fontFamily:fontFor(s.styles.pinDetailTitleFont,'Playfair Display'),fontSize:s.styles.pinDetailTitleSize||'3rem',color:s.styles.pinDetailTitleColor||RS?.colors?.paper||'#f4efe6'});
      [document.getElementById('pinSubtitle'),document.getElementById('pinMeta')].forEach(el=>setStyles(el,{fontFamily:fontFor(s.styles.pinDetailMetaFont,'JetBrains Mono'),fontSize:s.styles.pinDetailMetaSize||'10px',color:s.styles.pinDetailMetaColor||RS?.colors?.paper||'#f4efe6'}));
      setStyles(document.getElementById('pinBody'),{fontFamily:fontFor(s.styles.pinDetailBodyFont,'sans'),fontSize:s.styles.pinDetailBodySize||'15px',color:s.styles.pinDetailBodyColor||RS?.colors?.paper||'#f4efe6'});
      setStyles(document.getElementById('pinQuote'),{fontFamily:fontFor(s.styles.pinDetailQuoteFont,'Playfair Display'),fontSize:s.styles.pinDetailQuoteSize||'1.5rem',color:s.styles.pinDetailQuoteColor||RS?.colors?.paper||'#f4efe6'});
      setStyles(document.getElementById('pinQuoteAuthor'),{fontFamily:fontFor(s.styles.pinDetailMetaFont,'JetBrains Mono'),fontSize:s.styles.pinDetailMetaSize||'10px',color:s.styles.pinDetailMetaColor||RS?.colors?.paper||'#f4efe6'});
      { const pdb=document.querySelector('#pinDetail > div'); if(pdb) pdb.style.setProperty('background',hexA(s.styles.pinDetailBg||'#131110',(s.styles.pinDetailBgOpacity!==undefined?s.styles.pinDetailBgOpacity:0.95)),'important'); }
      document.querySelectorAll('[data-close-overlay]').forEach(b=>{ setStyles(b,{fontFamily:fontFor(s.styles.overlayCloseFont,'JetBrains Mono'),fontSize:s.styles.overlayCloseSize||'10px'}); b.style.setProperty('color',s.styles.overlayCloseColor||RS?.colors?.paper||'#f4efe6'); });
      setStyles(document.getElementById('cmsTitle'),{fontFamily:fontFor(s.styles.cmsTitleFont,'Playfair Display'),fontSize:s.styles.cmsTitleSize||'3.75rem',color:s.styles.cmsTitleColor||RS?.colors?.paper||'#f4efe6'});
      if(s.styles.pinNavItem){ ['pinPrev','pinNext'].forEach(id=>{const el=document.getElementById(id); if(el) el.className=s.styles.pinNavItem;}); }
      if(s.styles.navGap){ const nav=document.querySelector('nav.pointer-events-auto.flex'); if(nav) nav.className='pointer-events-auto flex items-center '+s.styles.navGap; }
      if(s.styles.navItem){ document.querySelectorAll('[data-overlay]').forEach(b=> b.className=s.styles.navItem); }
      if(s.styles.subtitle){ const sub=document.querySelector('#logoBtn .mono'); if(sub) sub.className=s.styles.subtitle; }
      if(s.styles.pinBtn){ window.__pinBtnClass=s.styles.pinBtn; }
      if(s.styles.pinOpacity!==undefined) window.__pinOpacity=s.styles.pinOpacity;
      if(s.styles.pinColor) window.__pinColor=s.styles.pinColor;
      if(s.styles.pinShape) window.__pinShape=s.styles.pinShape;
      if(s.styles.pinBg) window.__pinBg=s.styles.pinBg;
      if(s.styles.pinBgOpacity!==undefined) window.__pinBgOpacity=s.styles.pinBgOpacity;
      if(s.styles.pinPulseOpacity!==undefined) window.__pinPulseOpacity=s.styles.pinPulseOpacity;
      if(s.styles.pinPulseScale!==undefined) window.__pinPulseScale=s.styles.pinPulseScale;
      if(s.styles.pinPulseColor) window.__pinPulseColor=s.styles.pinPulseColor;
      if(s.styles.indexToggle){ const it=document.getElementById('indexToggle'); if(it) it.className=s.styles.indexToggle; }
if(s.styles.topBar){ const hb=document.getElementById('topBar'); if(hb) hb.className=s.styles.topBar; }
      if(s.styles.soundBtn){ const sb=document.getElementById('soundBtn'); if(sb) sb.className=s.styles.soundBtn; const st=document.getElementById('soundToggle'); if(st) st.className=s.styles.soundBtn; }
      if(s.styles.hint){ const hw=document.getElementById('hintText'); if(hw) hw.className=s.styles.hint; }
      if(s.styles.loaderTitle){ const lt=document.getElementById('loaderTitle'); if(lt) lt.className=s.styles.loaderTitle; }
      setStyles(q('#loaderTitle'),{fontFamily:fontFor(s.styles.loaderTitleFont,'Playfair Display'),color:s.styles.loaderTitleColor||RS?.colors?.paper||'#f4efe6'});
      ['loaderCoords','loaderLocation','loaderPowered','loaderVisits','loaderVisitsSuffix','loaderLoading','loaderPct'].forEach(id=>setStyles(document.getElementById(id),{fontFamily:fontFor(s.styles.loaderMetaFont,'JetBrains Mono'),fontSize:s.styles.loaderMetaSize||'10px',color:s.styles.loaderMetaColor||RS?.colors?.paper||'#f4efe6'}));
      setStyles(document.getElementById('loaderDesc'),{fontFamily:fontFor(s.styles.loaderDescFont,'sans'),fontSize:s.styles.loaderDescSize||'15px',color:s.styles.loaderDescColor||RS?.colors?.paper||'#f4efe6'});
      if(s.styles.loaderBarColor){ const lb=document.getElementById('loaderBar'); if(lb) lb.style.setProperty('background',s.styles.loaderBarColor,'important'); }
      if(s.styles.loaderBgOpacity!==undefined){ const lbg=document.getElementById('loaderBg'); if(lbg) lbg.style.opacity=s.styles.loaderBgOpacity; }
      applySoundStyle();
    }
    renderMarquee();
    renderPins();
    renderIndex();
    if(document.getElementById('voicesRoot')?.children.length) initVoices();
    if(document.getElementById('cmsRoot')?.children.length) initCms();
    if(activeId){
      const p=pins.find(x=>x.id===activeId);
      if(p) openPinDetail(p);
    }
}

function applyRendersColors(colors){
  if(!colors) return;
  if(colors.paper) document.documentElement.style.setProperty('--paper', colors.paper);
  if(colors.ink) document.documentElement.style.setProperty('--ink', colors.ink);
  if(colors.clay) document.documentElement.style.setProperty('--clay', colors.clay);
  const paper=colors.paper||'#f4efe6', ink=colors.ink||'#0d0c0b', clay=colors.clay||'#E4572E';
  const css=`
    body{background:${ink} !important;color:${paper} !important}
    main#app{background:${ink} !important}
    #mapStage,#loader{background:${ink} !important}
    #loader h1,#pinTitle,#overlayAbout h2,#overlayVoices h2,#overlayCms h2,#logoBtn .display{color:${paper} !important}
    #logoBtn .mono,#overlayAbout .mono:not([data-close-overlay]),#overlayVoices .mono:not([data-close-overlay]),#overlayCms .mono:not([data-close-overlay]){color:${hexA(paper,.65)} !important}
    button[data-overlay]{color:${hexA(paper,.6)} !important}
    button[data-overlay]:hover{color:${paper} !important}
    #indexStrip{background:${hexA(paper,.10)} !important}
    #indexStrip button{background:${(typeof RS!=='undefined'&&RS?.styles?.indexCardBg)||ink} !important;color:${paper} !important}
    #indexStrip button:hover{background:${(typeof RS!=='undefined'&&RS?.styles?.indexHover)||'#171513'} !important}
    #voicesRoot article{background:#131110 !important;color:${paper} !important}
    #enterBtn{border-color:${hexA(paper,.7)} !important;color:${paper} !important}
    #enterBtn span:last-child{background:${clay} !important}
    #loaderBar{background:${clay} !important}
    #pinClose:hover,#pinPrev:hover,#pinNext:hover{color:${clay} !important}
    button[data-close-overlay]:hover{color:${RS?.styles?.overlayCloseHover||paper} !important}
    #indexToggle:hover{color:${RS?.styles?.indexToggleHover||'#f4efe6'} !important}
    ::selection{background:${clay} !important;color:#fff !important}
  `;
  let tag=document.getElementById('rendersDynamic');
  if(!tag){ tag=document.createElement('style'); tag.id='rendersDynamic'; document.head.appendChild(tag); }
  tag.textContent=css;
}

function applySoundStyle(){
  const st=RS?.styles||{};
  const paper=RS?.colors?.paper||'#f4efe6';
  const text=st.sndTextColor||'#f4efe6';
  const border=st.sndBorderColor||'#f4efe6';
  let bg='transparent';
  if(st.sndBg==='paper10') bg=hexA(paper,.1);
  else if(st.sndBg==='paper25') bg=hexA(paper,.25);
  const fonts={mono:BTN_FONTS.mono,display:BTN_FONTS.display,sans:BTN_FONTS.sans};
  let soundFont=fonts[st.sndFont];
  if(!soundFont && st.sndFont){ const id='renders-sound-font-'+String(st.sndFont).toLowerCase().replace(/[^a-z0-9]+/g,'-'); if(!document.getElementById(id)){ const link=document.createElement('link'); link.id=id; link.rel='stylesheet'; link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(st.sndFont).replace(/%20/g,'+')+':wght@300;400;500;600;700;800&display=swap'; document.head.appendChild(link); } soundFont=`'${st.sndFont}',sans-serif`; }
  const style=`color:${hexA(text,.7)};border-color:${hexA(border,.2)};background:${bg};font-family:${soundFont||fonts.mono};font-size:${st.sndSize||'9px'}`;
  ['soundBtn','soundToggle'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.setAttribute('style',style);
  });
  // icon: animated bars | none | glyph
  const icon=st.sndIcon||'bars';
  document.querySelectorAll('#soundBtn .eqbars, #soundToggle .eqbars').forEach(w=>{
    if(icon==='none'){ w.style.display='none'; }
    else if(icon==='bars'){
      w.style.display='';
      if(!w.querySelector('.bar')){
        w.innerHTML='<span class="w-[2px] bg-current h-[2px] bar"></span><span class="w-[2px] bg-current h-[2px] bar"></span><span class="w-[2px] bg-current h-[2px] bar"></span><span class="w-[2px] bg-current h-[2px] bar"></span>';
      }
    }
    else { w.style.display=''; w.innerHTML='<span aria-hidden="true">'+icon+'</span>'; }
  });
}

function renderMarquee(){
  const el=document.getElementById('marqueeText');
  if(!el) return;
  const base=(RS?.marquee||'xlerion is more than just buildings · 50+ murals · community driven · san salvador, el salvador · ');
  const suffix=base.includes('flights') ? '' : visits.toLocaleString()+' flights · ';
  const line=base+suffix;
  el.textContent=line;
  const twin=el.nextElementSibling;
  if(twin) twin.textContent=line;
}
function pinDotStyle(pin){
  const col=window.__pinColor||pin.accent;
  const op=(window.__pinOpacity!==undefined)?window.__pinOpacity:1;
  const sh=window.__pinShape||'circle';
  const br=sh==='circle'?'50%':sh==='square'?'0':sh==='pill'?'999px':'8px';
  const bg=window.__pinBg||'#0d0c0b';
  const bgOp=(window.__pinBgOpacity!==undefined)?window.__pinBgOpacity:0.6;
  const pulseOp=(window.__pinPulseOpacity!==undefined)?window.__pinPulseOpacity:0.5;
  const pulseScale=(window.__pinPulseScale!==undefined)?window.__pinPulseScale:1;
  const pulseCol=window.__pinPulseColor||col;
  const paper=RS?.colors?.paper||'#f4efe6';
  return {col,op,br,bg,bgOp,pulseOp,pulseScale,pulseCol,paper};
}
function renderPins(){
  if(!$pinsLayer) return;
  $pinsLayer.innerHTML='';
  const featNum=Number(RS?.styles?.featPin)||0;
  const featScale=parseFloat(RS?.styles?.featScale)||1.5;
  const featRing=RS?.styles?.featRing||RS?.colors?.clay||'#E4572E';
  pins.forEach((pin,i)=>{
    const isActive=pin.id===activeId;
    const isFeat=featNum>0&&(i+1)===featNum;
    const dot=pinDotStyle(pin);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className=window.__pinBtnClass||'group absolute';
    btn.style.background='transparent';
    btn.style.border='0';
    btn.style.padding='0';
    btn.style.appearance='none';
    btn.style.left=pin.x+'%'; btn.style.top=pin.y+'%';
    btn.style.transform=`translate(-50%, -50%) scale(${(1/view.scale)*(isFeat?featScale:1)})`;
    btn.style.transition=animate?'transform 1300ms cubic-bezier(0.76,0,0.24,1)':'none';
    if(isFeat){ btn.style.boxShadow=`0 0 0 3px ${featRing}, 0 0 22px ${featRing}`; btn.style.borderRadius='999px'; btn.style.zIndex='5'; }
    btn.setAttribute('aria-label',pin.title);
    btn.innerHTML=`
      <span class="relative flex h-11 w-11 items-center justify-center">
        <span class="pin-pulse absolute h-6 w-6" style="background:${dot.pulseCol};border-radius:${dot.br};opacity:${dot.pulseOp};transform:scale(${dot.pulseScale})"></span>
        <span class="relative flex h-6 w-6 items-center justify-center border text-[9px] font-semibold transition-all duration-500 ${isActive?'scale-125 border-transparent text-[#0d0c0b]':'border-[#f4efe6]/80 bg-[#0d0c0b]/60 text-[#f4efe6] group-hover:scale-125'}" style="background:${isActive?dot.col:hexA(dot.bg,dot.bgOp)};color:${isActive?'#0d0c0b':dot.paper};border:1px solid ${isActive?'transparent':hexA(dot.col,.8)};border-radius:${dot.br};opacity:${dot.op}">${pin.number}</span>
      </span>
      <span class="mono pointer-events-none absolute left-1/2 top-full block -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0d0c0b]/80 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-[#f4efe6] opacity-0 backdrop-blur group-hover:opacity-100" style="background:${hexA(dot.bg,dot.bgOp)};color:${dot.paper}">${esc(pin.title)}</span>`;
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      if(placing) return;
      selectPin(pin);
    });
    $pinsLayer.appendChild(btn);
  });
}

function renderIndex(){
  if(!$indexStrip) return;
  $indexStrip.innerHTML='';
  pins.forEach(pin=>{
    const b=document.createElement('button');
    const st=RS?.styles||{}, paper=RS?.colors?.paper||'#f4efe6';
    const cardBg=()=>st.indexCardBg||RS?.colors?.ink||'#0d0c0b';
    b.className='group relative w-56 shrink-0 p-5 text-left';
    b.style.background=cardBg();
    b.style.color=paper;
    if(st.indexCardRadius) b.style.borderRadius=st.indexCardRadius;
    const tFont=fontFor(st.indexCardTitleFont,'Playfair Display'), tSize=st.indexCardTitleSize||'1.5rem', tCol=st.indexCardTitleColor||paper;
    const mFont=fontFor(st.indexCardMetaFont,'JetBrains Mono'), mSize=st.indexCardMetaSize||'9px', mCol=st.indexCardMetaColor||paper;
    b.innerHTML=`<span class="mono block text-[9px] uppercase tracking-[0.3em]" style="color:${pin.accent};font-family:${mFont};font-size:${mSize}">${String(pin.number).padStart(2,'0')} / ${pin.category}</span><span class="display mt-3 block text-2xl leading-tight" style="color:${tCol};font-family:${tFont};font-size:${tSize}">${esc(pin.title)}</span><span class="mono mt-2 block truncate text-[9px] uppercase tracking-[0.2em]" style="color:${hexA(mCol,.55)};font-family:${mFont};font-size:${mSize}">${esc(pin.artist||pin.subtitle)}</span>`;
    b.addEventListener('click',()=>selectPin(pin));
    $indexStrip.appendChild(b);
  });
  if($indexCount) $indexCount.textContent=pins.length+' '+(RS?.indexCountSuffix||'interventions mapped');
  if($indexToggle) $indexToggle.textContent=indexOpen ? (RS?.indexHide||'hide index −') : (RS?.indexOpen||'open index +');
}

// drag + rueda + táctil para la tira horizontal del índice
function initIndexScroll(){
  const strip=document.getElementById('indexStrip'); if(!strip||strip.dataset.scrollInit) return; strip.dataset.scrollInit='1';
  strip.style.cursor='grab'; strip.style.overscrollBehaviorX='contain'; strip.style.touchAction='pan-x';
  let down=false,sx=0,sl=0,moved=false;
  strip.addEventListener('pointerdown',e=>{ down=true; moved=false; sx=e.clientX; sl=strip.scrollLeft; strip.style.cursor='grabbing'; });
  window.addEventListener('pointermove',e=>{ if(!down) return; const dx=e.clientX-sx; if(Math.abs(dx)>4) moved=true; if(moved) strip.scrollLeft=sl-dx; });
  const end=()=>{ down=false; strip.style.cursor='grab'; };
  window.addEventListener('pointerup',end);
  window.addEventListener('pointercancel',end);
  strip.addEventListener('click',e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } },true);
  strip.addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ e.preventDefault(); strip.scrollLeft+=e.deltaY+e.deltaX; } },{passive:false});
}

function clampView(v){
  const s=size.s * v.scale;
  const maxX=Math.max(0,(s-size.w)/2);
  const maxY=Math.max(0,(s-size.h)/2);
  return {scale:v.scale, x:clamp(v.x,-maxX,maxX), y:clamp(v.y,-maxY,maxY)};
}
function applyView(){
  if(!$mapInner) return;
  $mapInner.style.width=size.s+'px'; $mapInner.style.height=size.s+'px';
  $mapInner.style.marginLeft=-size.s/2+'px'; $mapInner.style.marginTop=-size.s/2+'px';
  $mapInner.style.transform=`translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
  $mapInner.style.transition=animate?'transform 1300ms cubic-bezier(0.76,0,0.24,1)':'none';
  if($zoomLabel) $zoomLabel.textContent=view.scale.toFixed(2)+'×';
}

function focusPin(pin, offsetRatio=0.5){
  if(!size.s) return;
  const scale=size.w<900?2.1:2.4;
  const offX=(pin.x/100-0.5)*size.s*scale;
  const offY=(pin.y/100-0.5)*size.s*scale;
  const targetX=size.w*offsetRatio;
  const targetY=size.h*(size.w<900?0.34:0.5);
  animate=true; view=clampView({scale, x:targetX-size.w/2-offX, y:targetY-size.h/2-offY});
  applyView(); renderPins();
}
function resetView(){ animate=true; view=clampView({scale:1.25,x:0,y:0}); applyView(); renderPins(); }

function selectPin(pin){
  activeId=pin.id; document.getElementById('indexPanel').classList.remove('max-h-[42vh]');
  document.getElementById('indexPanel').classList.add('max-h-0');
  indexOpen=false; document.getElementById('indexToggle').textContent=RS?.indexOpen||'open index +';
  const offset=window.innerWidth<1024?0.5:0.28;
  focusPin(pin,offset);
  openPinDetail(pin);
}

function step(dir){
  if(!pins.length) return;
  const idx=pins.findIndex(p=>p.id===activeId);
  const next=pins[(idx+dir+pins.length)%pins.length];
  selectPin(next);
}
function closePin(){
  activeId=null; closePinDetail(); resetView();
}

function openPinDetail(pin){
  const idx=pins.findIndex(p=>p.id===pin.id);
  $pinDetail.classList.remove('translate-y-full','lg:translate-x-full');
  $pinDetail.classList.add('translate-y-0','lg:translate-x-0');
  $pinImage.src=pin.imageUrl||'images/p1.jpg'; $pinAccent.style.background=pin.accent; $pinDot.style.background=pin.accent;
  $pinMeta.textContent=`pin ${String(pin.number).padStart(2,'0')} · ${pin.category} · ${pin.year}`;
  $pinTitle.textContent=pin.title; $pinSubtitle.textContent=pin.subtitle + (pin.artist?` — ${pin.artist}`:'');
  $pinBody.textContent=pin.body;
  if(pin.quote){ $pinQuoteWrap.classList.remove('hidden'); $pinQuote.textContent=`“${pin.quote}”`; $pinQuoteAuthor.textContent=pin.quoteAuthor; $pinQuoteWrap.style.borderColor=pin.accent; } else $pinQuoteWrap.classList.add('hidden');
  { const wv=document.getElementById('pinVideoWrap'); const url=ytEmbed(pin.videoUrl);
    if(wv){ if(url){ wv.classList.remove('hidden'); const fr=document.getElementById('pinVideoFrame'); if(fr && fr.dataset.src!==url){ fr.dataset.src=url; fr.src=url; } }
      else { wv.classList.add('hidden'); const fr=document.getElementById('pinVideoFrame'); if(fr){ fr.removeAttribute('src'); delete fr.dataset.src; } } } }
  $pinCount.textContent=`${String(idx+1).padStart(2,'0')} / ${String(pins.length).padStart(2,'0')}`;
}
function closePinDetail(){
  $pinDetail.classList.add('translate-y-full','lg:translate-x-full');
  $pinDetail.classList.remove('translate-y-0','lg:translate-x-0');
  const fr=document.getElementById('pinVideoFrame'); if(fr){ fr.removeAttribute('src'); delete fr.dataset.src; }
}

function openOverlay(key){
  overlay=key;
  document.getElementById('overlay'+key.charAt(0).toUpperCase()+key.slice(1)).classList.remove('opacity-0','pointer-events-none');
  document.getElementById('overlay'+key.charAt(0).toUpperCase()+key.slice(1)).querySelector('.overlay-panel').classList.remove('translate-y-full');
}
function closeOverlay(){
  if(!overlay) return;
  const el=document.getElementById('overlay'+overlay.charAt(0).toUpperCase()+overlay.slice(1));
  el.classList.add('opacity-0','pointer-events-none');
  el.querySelector('.overlay-panel').classList.add('translate-y-full');
  overlay=null;
}

function initVoices(){
  const root=document.getElementById('voicesRoot');
  if(!root) return;
  function render(){
    const clay=RS?.colors?.clay||'#E4572E';
    root.innerHTML=`
      <p class="max-w-xl text-[15px] leading-relaxed text-[#f4efe6]/70">${esc(RS?.voicesIntro||'The walls of the colonia were written on for decades. This one is open on purpose: leave a line, from here or from anywhere, and it stays on the map.')}</p>
      <form id="voiceForm" class="space-y-6 mt-8">
        <div class="grid gap-6 sm:grid-cols-2">
          <input class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30" style="--tw-border-opacity:1" placeholder="${esc(RS?.voicesNamePh||'Your name')}" id="voiceName" required maxlength="80">
          <input class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30" placeholder="${esc(RS?.voicesPlacePh||'Where are you writing from?')}" id="voicePlace" maxlength="80">
        </div>
        <textarea class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30 resize-none" placeholder="${esc(RS?.voicesMsgPh||'Your line on the wall…')}" rows="3" maxlength="600" id="voiceMsg" required></textarea>
        <div class="flex items-center gap-4">
          <button type="submit" class="mono group relative overflow-hidden rounded-full border border-[#f4efe6]/50 px-8 py-3 text-[10px] uppercase tracking-[0.3em]" style="${submitBtnStyle()}"><span class="relative z-10 group-hover:text-[#0d0c0b]">${submitBtnIcon().left}${esc(RS?.voicesSubmit||'paint it on the wall')}${submitBtnIcon().right}</span>${submitBtnFill()}</button>
          <span id="voiceStatus" class="mono text-[10px]"></span>
        </div>
      </form>
      <div class="grid gap-px bg-[#f4efe6]/10 sm:grid-cols-2 mt-10">
        ${voices.map(v=>`<article class="bg-[#131110] p-6"><p class="text-[15px] leading-relaxed text-[#f4efe6]/85">${esc(v.message)}</p><p class="mono mt-4 text-[10px] uppercase tracking-[0.25em] text-[#f4efe6]/40">${esc(v.name)}${v.place?` · ${esc(v.place)}`:''}</p></article>`).join('')}
      </div>`;
    const form=document.getElementById('voiceForm');
    if(form) form.addEventListener('submit',async e=>{
      e.preventDefault();
      const name=document.getElementById('voiceName').value.trim();
      const place=document.getElementById('voicePlace').value.trim();
      const message=document.getElementById('voiceMsg').value.trim();
      if(!name||!message) return;
      const status=document.getElementById('voiceStatus');
      status.textContent=RS?.voicesSaving||'saving…';
      const newVoice={id:Date.now(),name,place,message,createdAt:new Date().toISOString()};
      voices=[newVoice,...voices];
      // persist to portfolio.json
      try{
        const r=await fetch('data/portfolio.json',{cache:'no-store'}); const d=await r.json();
        d.renders=d.renders||{}; d.renders.voices=voices; d.renders.visits=visits;
        await fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
      }catch{}
      render(); initVoices();
    });
  }
  render();
}

function initCms(){
  const root=document.getElementById('cmsRoot');
  if(!root) return;
  function render(){
    const email=RS?.cmsEmail||'miguelxlerion@gmail.com';
    const ff=fontFor(RS?.styles?.cmsFormFont,'sans'), fs=RS?.styles?.cmsFormSize||'14px', fc=RS?.styles?.cmsFormColor||RS?.colors?.paper||'#f4efe6';
    const fistyle=`font-family:${ff};font-size:${fs};color:${fc}`;
    const istyle=`font-family:${fontFor(RS?.styles?.cmsIntroFont,'sans')};font-size:${RS?.styles?.cmsIntroSize||'15px'};color:${RS?.styles?.cmsIntroColor||RS?.colors?.paper||'#f4efe6'}`;
    const emstyle=`font-family:${fontFor(RS?.styles?.cmsEmailFont,'Playfair Display')};font-size:${RS?.styles?.cmsEmailSize||'1.5rem'};color:${RS?.styles?.cmsEmailColor||RS?.colors?.paper||'#f4efe6'}`;
    root.innerHTML=`
      <p id="cmsIntroP" class="max-w-xl text-[15px] leading-relaxed text-[#f4efe6]/70" style="${istyle}">${esc(RS?.cmsIntro||'¿Tienes un muro, una historia o una propuesta? Escríbeme directamente: respondo cada mensaje personalmente.')}</p>
      <a href="mailto:${esc(email)}" class="group mt-8 block bg-[#131110] p-6">
        <p class="mono text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/40">${esc(RS?.cmsInfoTitle||'información · contacto')}</p>
        <p id="cmsInfoEmail" class="display mt-3 text-2xl text-[#f4efe6] group-hover:text-[#E4572E] break-all sm:text-3xl" style="${emstyle}">${esc(email)}</p>
        <p class="mt-3 max-w-xl text-sm leading-relaxed text-[#f4efe6]/60">${esc(RS?.cmsInfoText||'')}</p>
      </a>
      <form id="cmsContactForm" class="space-y-6 mt-8">
        <div class="grid gap-6 sm:grid-cols-2">
          <input class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30" style="${fistyle}" placeholder="${esc(RS?.cmsNamePh||'Tu nombre *')}" id="cmsContactName" required maxlength="80">
          <input type="email" class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30" style="${fistyle}" placeholder="${esc(RS?.cmsEmailPh||'Tu correo *')}" id="cmsContactEmail" required maxlength="120">
        </div>
        <input class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30" style="${fistyle}" placeholder="${esc(RS?.cmsSubjectPh||'Asunto')}" id="cmsContactSubject" maxlength="120">
        <textarea class="w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none placeholder:text-[#f4efe6]/30 resize-none" style="${fistyle}" rows="4" placeholder="${esc(RS?.cmsMsgPh||'Tu mensaje…')}" id="cmsContactMsg" required maxlength="2000"></textarea>
        <div class="flex items-center gap-4">
          <button type="submit" class="mono group relative overflow-hidden rounded-full border border-[#f4efe6]/50 px-8 py-3 text-[10px] uppercase tracking-[0.3em]" style="${submitBtnStyle()}"><span class="relative z-10 group-hover:text-[#0d0c0b]">${submitBtnIcon().left}${esc(RS?.cmsSubmit||'enviar mensaje')}${submitBtnIcon().right}</span>${submitBtnFill()}</button>
          <span id="cmsStatus" class="mono text-[10px]"></span>
        </div>
      </form>`;
    document.getElementById('cmsContactForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const name=document.getElementById('cmsContactName').value.trim();
      const from=document.getElementById('cmsContactEmail').value.trim();
      const subject=document.getElementById('cmsContactSubject').value.trim();
      const message=document.getElementById('cmsContactMsg').value.trim();
      if(!name||!from||!message) return;
      const st=document.getElementById('cmsStatus');
      st.textContent=RS?.cmsSending||'enviando…';
      const body=message+'\n\n— '+name+' ('+from+')';
      window.location.href='mailto:'+email+'?subject='+encodeURIComponent(subject||('Contacto web — '+name))+'&body='+encodeURIComponent(body);
      st.textContent=RS?.cmsSent||'¡Gracias! Se abrió tu correo con el mensaje listo para enviar.';
      st.className='mono text-[10px] text-[#1D7874]';
    });
  }
  render();
}

// Audio
function initAudio(){
  let ctx=null, master=null, stopFn=null, timer=null;
  function build(){
    const Ctor=window.AudioContext||window.webkitAudioContext; if(!Ctor) return null;
    ctx=new Ctor(); master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const rev=ctx.createConvolver(); const len=ctx.sampleRate*2.4; const imp=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let c=0;c<2;c++){ const d=imp.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
    rev.buffer=imp; const wet=ctx.createGain(); wet.gain.value=.35; rev.connect(wet); wet.connect(master);
    const freqs=[73.42,110,164.81,220];
    freqs.forEach((f,i)=>{
      const osc=ctx.createOscillator(); osc.type=i%2===0?'sine':'triangle'; osc.frequency.value=f; osc.detune.value=(i-1.5)*6;
      const g=ctx.createGain(); g.gain.value=.12/(i+1);
      const lfo=ctx.createOscillator(); lfo.frequency.value=.03+i*.017; const lg=ctx.createGain(); lg.gain.value=.05; lfo.connect(lg); lg.connect(g.gain);
      osc.connect(g); g.connect(master); g.connect(rev); osc.start(); lfo.start();
    });
    const nb=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate); const nd=nb.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
    const src=ctx.createBufferSource(); src.buffer=nb; src.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=420; bp.Q.value=.7;
    const ng=ctx.createGain(); ng.gain.value=.05; src.connect(bp); bp.connect(ng); ng.connect(master); ng.connect(rev); src.start();
    const scale=[329.63,392,440,493.88,587.33];
    timer=setInterval(()=>{ if(ctx.state!=='running') return; const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.value=scale[Math.floor(Math.random()*scale.length)]; const n=ctx.currentTime; g.gain.setValueAtTime(0,n); g.gain.linearRampToValueAtTime(.06,n+.04); g.gain.exponentialRampToValueAtTime(.0001,n+3.2); o.connect(g); g.connect(rev); g.connect(master); o.start(n); o.stop(n+3.4); },6200);
    return {ctx,master,stop:()=>{clearInterval(timer); try{ctx.close()}catch{}}};
  }
  function toggle(){
    if(!audioNodes){
      const b=build(); if(!b) return; audioNodes=b; ctx=b.ctx; master=b.master;
    }
    if(ctx.state==='suspended') ctx.resume();
    audioEnabled=!audioEnabled;
    const now=ctx.currentTime; master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value,now); master.gain.linearRampToValueAtTime(audioEnabled?.55:0,now+1.6);
    document.getElementById('soundLabel').textContent=audioEnabled?(RS?.soundOn||'sound on'):(RS?.soundOff||'sound off');
    document.getElementById('soundToggleLabel').textContent=audioEnabled?(RS?.soundOn||'sound on'):(RS?.soundOff||'sound off');
    document.querySelectorAll('.bar').forEach((el,i)=>{ el.style.height=audioEnabled?`${4+((i*5)%8)}px`:'2px'; });
  }
  return {toggle, get enabled(){return audioEnabled}};
}
let audioCtl=null;

// MapStage pan/zoom
function initMapStage(){
  const container=document.getElementById('mapStage');
  const inner=document.getElementById('mapInner');
  $mapStage=container; $mapInner=inner;
  function updateSize(){
    const r=container.getBoundingClientRect();
    size={w:r.width,h:r.height,s:Math.max(r.width,r.height)};
    applyView(); renderPins();
  }
  new ResizeObserver(updateSize).observe(container); updateSize();
  let pointers=new Map(), dragStart=null, pinchStart=null, moved=false;
  container.addEventListener('wheel',e=>{
    const rect=container.getBoundingClientRect();
    const factor=Math.exp(-e.deltaY*0.0016);
    zoomAt(factor, e.clientX-rect.left, e.clientY-rect.top);
  },{passive:true});
  container.addEventListener('pointerdown',e=>{
    e.target.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); moved=false;
    if(pointers.size===1){ dragStart={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y}; animate=false; }
    else if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      pinchStart={dist:Math.hypot(a.x-b.x,a.y-b.y),scale:view.scale};
    }
  });
  container.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>=2 && pinchStart){
      const [a,b]=[...pointers.values()];
      const dist=Math.hypot(a.x-b.x,a.y-b.y);
      const rect=container.getBoundingClientRect();
      const nextScale=clamp(pinchStart.scale*dist/pinchStart.dist,MIN_SCALE,MAX_SCALE);
      moved=true;
      const k=nextScale/view.scale;
      const px=(a.x+b.x)/2-rect.left-size.w/2;
      const py=(a.y+b.y)/2-rect.top-size.h/2;
      view=clampView({scale:nextScale, x:px-(px-view.x)*k, y:py-(py-view.y)*k});
      applyView(); renderPins(); return;
    }
    if(!dragStart) return;
    const dx=e.clientX-dragStart.x, dy=e.clientY-dragStart.y;
    if(Math.abs(dx)+Math.abs(dy)>5) moved=true;
    view=clampView({scale:view.scale, x:dragStart.vx+dx, y:dragStart.vy+dy});
    applyView(); renderPins();
  });
  container.addEventListener('pointerup',e=>{
    pointers.delete(e.pointerId);
    if(pointers.size<2) pinchStart=null;
    if(pointers.size===0) dragStart=null;
  });
  container.addEventListener('pointercancel',e=>{
    pointers.delete(e.pointerId);
    if(pointers.size<2) pinchStart=null;
    if(pointers.size===0) dragStart=null;
  });
  container.addEventListener('click',e=>{
    if(!placing || moved) return;
    const rect=container.getBoundingClientRect();
    const px=e.clientX-rect.left-size.w/2-view.x;
    const py=e.clientY-rect.top-size.h/2-view.y;
    const x=clamp((px/(size.s*view.scale)+0.5)*100,1,99);
    const y=clamp((py/(size.s*view.scale)+0.5)*100,1,99);
    coords={x,y}; placing=false;
    document.getElementById('placingHint').classList.add('hidden');
    document.getElementById('placingHint').classList.remove('flex');
    openOverlay('cms');
  });
  function zoomAt(factor,cx,cy){
    animate=false;
    const nextScale=clamp(view.scale*factor,MIN_SCALE,MAX_SCALE);
    const k=nextScale/view.scale;
    const px=cx-size.w/2, py=cy-size.h/2;
    view=clampView({scale:nextScale, x:px-(px-view.x)*k, y:py-(py-view.y)*k});
    applyView(); renderPins();
  }
  document.getElementById('zoomIn').addEventListener('click',e=>{e.stopPropagation(); zoomAt(1.35,size.w/2,size.h/2)});
  document.getElementById('zoomOut').addEventListener('click',e=>{e.stopPropagation(); zoomAt(1/1.35,size.w/2,size.h/2)});
  stage.focusPin=focusPin; stage.reset=resetView;
  stage.zoomAt=zoomAt;
}

window.addEventListener('message', e=>{
  if(e.data && e.data.type==='portfolio-update' && e.data.data?.renders){
    const wasActive=activeId;
    pins=e.data.data.renders.pins||pins;
    voices=e.data.data.renders.voices||voices;
    if(typeof e.data.data.renders.visits==='number') visits=e.data.data.renders.visits;
    if(e.data.data.renders.settings) RS=e.data.data.renders.settings;
    applyRendersSettings(RS);
    if(wasActive){
      const p=pins.find(x=>x.id===wasActive);
      if(p) openPinDetail(p);
    }
  }
});
// Boot
document.addEventListener('DOMContentLoaded', async ()=>{
  $mapStage=document.getElementById('mapStage'); $mapInner=document.getElementById('mapInner'); $pinsLayer=document.getElementById('pinsLayer');
  $zoomLabel=document.getElementById('zoomLabel'); $topBar=document.getElementById('topBar');
  $hintWrap=document.getElementById('hintWrap'); $hintText=document.getElementById('hintText');
  $bottomIndex=document.getElementById('bottomIndex'); $indexCount=document.getElementById('indexCount'); $indexToggle=document.getElementById('indexToggle'); $indexPanel=document.getElementById('indexPanel'); $indexStrip=document.getElementById('indexStrip');
  $pinDetail=document.getElementById('pinDetail'); $pinImage=document.getElementById('pinImage'); $pinAccent=document.getElementById('pinAccent'); $pinDot=document.getElementById('pinDot'); $pinMeta=document.getElementById('pinMeta'); $pinTitle=document.getElementById('pinTitle'); $pinSubtitle=document.getElementById('pinSubtitle'); $pinBody=document.getElementById('pinBody'); $pinQuoteWrap=document.getElementById('pinQuoteWrap'); $pinQuote=document.getElementById('pinQuote'); $pinQuoteAuthor=document.getElementById('pinQuoteAuthor'); $pinCount=document.getElementById('pinCount');
  $loader=document.getElementById('loader'); $loaderBar=document.getElementById('loaderBar'); $loaderPct=document.getElementById('loaderPct'); $loaderVisits=document.getElementById('loaderVisits'); $enterBtn=document.getElementById('enterBtn'); $soundToggle=document.getElementById('soundToggle'); $soundLabel=document.getElementById('soundLabel'); $soundBtn=document.getElementById('soundBtn'); $placingHint=document.getElementById('placingHint');

  await loadData();
  applyRendersSettings();
  $loaderVisits.textContent=visits.toLocaleString();
  renderPins(); renderIndex(); initMapStage(); initVoices(); initCms(); initIndexScroll();
  applyRendersSettings();
  audioCtl=initAudio();

  // loader progress
  let progress=0, frame=0;
  const iv=setInterval(()=>{
    frame++; progress+=Math.max(.8,(100-progress)*.06)+(frame%7===0?3:0);
    if(progress>=100) progress=100;
    $loaderBar.style.width=progress+'%'; $loaderPct.textContent=Math.round(progress)+'%';
    if(progress>=100){
      clearInterval(iv);
      $enterBtn.disabled=false;
      $enterBtn.classList.remove('cursor-not-allowed','border-[#f4efe6]/15','text-[#f4efe6]/30');
      $enterBtn.classList.add('border-[#f4efe6]/70','text-[#f4efe6]','hover:border-[#E4572E]');
      $enterBtn.querySelector('span:last-child')?.classList.add('group-hover:scale-y-100');
      document.getElementById('loaderBg').style.transform='scale(1.14)';
    }
  },45);

  // hints rotation
  let hi=0; setInterval(()=>{ hi=(hi+1)%HINTS.length; if($hintText) $hintText.textContent=HINTS[hi]; },3600);

  // enter
  function enter(withAudio){
    $loader.classList.add('opacity-0','pointer-events-none');
    $loader.style.transform='scale(1.35)';
    setTimeout(()=> $loader.style.display='none',900);
    entered=true;
    $topBar.classList.remove('-translate-y-6','opacity-0'); $topBar.classList.add('translate-y-0','opacity-100');
    $hintWrap.classList.remove('opacity-0'); $hintWrap.classList.add('opacity-100');
    $bottomIndex.classList.remove('translate-y-full','opacity-0'); $bottomIndex.classList.add('translate-y-0','opacity-100');
    if(withAudio) setTimeout(()=> audioCtl.toggle(),200);
    fetch('/api/visits',{method:'POST'}).catch(()=>{});
    visits++; if($loaderVisits) $loaderVisits.textContent=visits.toLocaleString();
    // persist visits
    fetch('data/portfolio.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
      d.renders=d.renders||{}; d.renders.visits=visits;
      fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).catch(()=>{});
    }).catch(()=>{});
  }
  $enterBtn.addEventListener('click',()=>{
    if($enterBtn.disabled) return;
    $loader.classList.add('opacity-0'); enter(document.getElementById('soundToggle').dataset.enabled==='true');
  });
  document.getElementById('soundToggle').addEventListener('click',()=>{
    const btn=document.getElementById('soundToggle');
    const on=btn.dataset.enabled==='true';
    btn.dataset.enabled=on?'false':'true';
    if(!entered) return;
    audioCtl.toggle();
  });
  $soundBtn.addEventListener('click',()=> audioCtl.toggle());
  document.getElementById('soundToggle').addEventListener('click',()=>{
    // handled above
  });

  // index toggle
  $indexToggle.addEventListener('click',()=>{
    indexOpen=!indexOpen;
    const openTxt = window.__indexOpen || 'open index +';
    const hideTxt = window.__indexHide || 'hide index −';
    if(indexOpen){ $indexPanel.classList.remove('max-h-0'); $indexPanel.classList.add('max-h-[42vh]'); $indexToggle.textContent=hideTxt; }
    else { $indexPanel.classList.add('max-h-0'); $indexPanel.classList.remove('max-h-[42vh]'); $indexToggle.textContent=openTxt; }
  });

  // pin nav
  document.getElementById('pinClose').addEventListener('click',closePin);
  document.getElementById('pinPrev').addEventListener('click',()=>step(-1));
  document.getElementById('pinNext').addEventListener('click',()=>step(1));
  document.getElementById('logoBtn').addEventListener('click',closePin);

  // overlays
  document.querySelectorAll('[data-overlay]').forEach(b=>b.addEventListener('click',()=> openOverlay(b.dataset.overlay)));
  document.querySelectorAll('[data-close-overlay]').forEach(b=>b.addEventListener('click',closeOverlay));
  document.querySelectorAll('.overlay-bg').forEach(bg=>bg.addEventListener('click',closeOverlay));
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(overlay) closeOverlay();
      else if(activeId) closePin();
    }
    if(!activeId||overlay) return;
    if(e.key==='ArrowRight') step(1);
    if(e.key==='ArrowLeft') step(-1);
  });

  // show hint only when entered and no pin/overlay
  setInterval(()=>{
    const show=entered && !activeId && !overlay;
    $hintWrap.classList.toggle('opacity-100',show);
    $hintWrap.classList.toggle('opacity-0',!show);
  },500);
});
