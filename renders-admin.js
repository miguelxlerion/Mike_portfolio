// renders-admin.js — CMS exhaustivo para Renders
(function(){
  function esc(s){ return String(s||'').replace(/"/g,'&quot;'); }
  function renameBrand(value){
    if(typeof value==='string') return value.replace(/zacamil/gi,'Xlerion');
    if(Array.isArray(value)) return value.map(renameBrand);
    if(value && typeof value==='object') Object.keys(value).forEach(k=>{ value[k]=renameBrand(value[k]); });
    return value;
  }
  function ensure(){
    if(!window.state) window.state={};
    if(!state.renders) state.renders={visits:12840,pins:[],voices:[],settings:{}};
    state.renders=renameBrand(state.renders);
    const s=state.renders.settings||{};
    const defaults={
      sectionTitle:'Renders — Xlerion',title:'Xlerion',subtitle:'open air museum · sv',headerTitle:'Xlerion',headerSubtitle:'open air museum · sv',
      navAbout:'about',navVoices:'voices',navCms:'[cms]',soundOn:'sound on',soundOff:'sound off',
      loaderFlyTo:'fly to',loaderTitle:'Xlerion',loaderDesc:'Xlerion is more than just buildings.',loaderLoading:'loading assets',loaderEnter:'enter the colonia',
      loaderSoundOn:'sound on',loaderSoundOff:'sound off',loaderCoords:"13°43′N 89°13′W",loaderLocation:'San Salvador · El Salvador',loaderPowered:'[ powered by CMS ]',loaderVisitsSuffix:'flights so far',loaderBg:'images/Oficina0013.jpg',
      hints:['click and drag to explore','scroll to zoom in & out','click on the pins to learn more'],
      mapImage:'images/proyectos-parallax.jpg',
      indexCountSuffix:'interventions mapped',indexOpen:'open index +',indexHide:'hide index −',
      marquee:'xlerion is more than just buildings · 50+ murals · community driven · san salvador, el salvador · ',
      aboutLabel:'about the project',aboutTitle:'More than just buildings.',aboutVideoLabel:'film',aboutVideoUrl:'',aboutHeroSub:'React · Next.js · Django · Three.js · LangChain · pgvector · FastAPI. I ship Digital Twins, RAG platforms and IoT telemetry that turn massive tabular/sensor data into interactive 3D experiences — with resilient ingestion, hybrid search and stable FPS.',
      aboutStats:[{k:'1974',v:'first blocks built'},{k:'50+',v:'murals painted'},{k:'8',v:'mapped pins'},{k:'∞',v:'stories left'}],
      aboutParas:['p1','p2','p3'],
      aboutMeta:[{k:'location',v:'Mejicanos, San Salvador'},{k:'status',v:'Ongoing since 2024'},{k:'built with',v:'Vanilla JS'}],
      voicesLabel:'the open wall',voicesTitle:'Voices.',voicesVideoLabel:'film',voicesVideoUrl:'',voicesIntro:'The walls...',
      voicesNamePh:'Your name',voicesPlacePh:'Where are you writing from?',voicesMsgPh:'Your line on the wall...',voicesSubmit:'paint it on the wall',voicesSaving:'writing...',
      cmsLabel:'contacto directo',cmsTitle:'Contacto',cmsVideoLabel:'film',cmsVideoUrl:'',cmsIntro:'¿Tienes un muro, una historia o una propuesta? Escríbeme directamente: respondo cada mensaje personalmente.',
      cmsEmail:'miguelxlerion@gmail.com',cmsInfoTitle:'información · contacto',cmsInfoText:'San Salvador · El Salvador — respuesta en 24-48h.',
      cmsNamePh:'Tu nombre *',cmsEmailPh:'Tu correo *',cmsSubjectPh:'Asunto',cmsMsgPh:'Tu mensaje…',cmsSubmit:'enviar mensaje',cmsSending:'enviando…',cmsSent:'¡Gracias! Se abrió tu correo con el mensaje listo para enviar.',
      pinClose:'close',pinPrev:'previous',pinNext:'next',placingHint:'click anywhere on the map to drop your pin',overlayClose:'close ✕',
      colors:{paper:'#f4efe6',ink:'#0d0c0b',clay:'#E4572E'},loaderImage:'images/Oficina0013.jpg',
      styles:{navGap:'gap-5 sm:gap-7',navItem:'mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60 transition-colors hover:text-[#f4efe6]',subtitle:'mono mt-1 block text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/45',pinBtn:'group absolute',indexToggle:'mono text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/40 hover:text-[#f4efe6]',soundBtn:'mono flex items-center gap-2 rounded-full border border-[#f4efe6]/20 px-4 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f4efe6]/70 transition-colors hover:border-[#f4efe6]/60',hint:'mono rounded-full border border-[#f4efe6]/15 bg-[#0d0c0b]/40 px-5 py-2 text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/60 backdrop-blur-sm',loaderTitle:'display text-[19vw] leading-[0.82] text-[#f4efe6] sm:text-[15vw] lg:text-[13rem]',btnFill:'absolute inset-0 origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500',btnTextColor:'#f4efe6',btnBorderColor:'#f4efe6',btnFillColor:'#E4572E',btnBg:'transparent',btnFont:'mono',btnSize:'11px',btnIcon:'',btnIconPos:'left',sndTextColor:'#f4efe6',sndBorderColor:'#f4efe6',sndBg:'transparent',sndFont:'mono',sndSize:'9px',sndIcon:'bars',featPin:0,featScale:'1.5',featRing:'#E4572E',pinBg:'#0d0c0b',pinBgOpacity:0.6}
    };
    for(const k in defaults){ if(s[k]===undefined) s[k]=defaults[k]; }
    s.styles=s.styles||{};
    if(s.styles.pinPulseOpacity===undefined) s.styles.pinPulseOpacity=0.5;
    if(s.styles.pinPulseScale===undefined) s.styles.pinPulseScale=1;
    if(s.styles.pinPulseColor===undefined) s.styles.pinPulseColor='';
    Object.assign(s.styles, {
      logoFont:s.styles.logoFont||'display', logoSize:s.styles.logoSize||'1.5rem', logoColor:s.styles.logoColor||'#f4efe6', logoWeight:s.styles.logoWeight||'400',
      subtitleFont:s.styles.subtitleFont||'mono', subtitleSize:s.styles.subtitleSize||'10px', subtitleColor:s.styles.subtitleColor||'#f4efe6',
      navFont:s.styles.navFont||'mono', navSize:s.styles.navSize||'10px', navColor:s.styles.navColor||'#f4efe6',
      indexFont:s.styles.indexFont||'mono', indexSize:s.styles.indexSize||'9px', indexColor:s.styles.indexColor||'#f4efe6',
      zoomBg:s.styles.zoomBg||'#0d0c0b', zoomColor:s.styles.zoomColor||'#f4efe6', zoomBorder:s.styles.zoomBorder||'#f4efe6', zoomRadius:s.styles.zoomRadius||'999px',
      cmsTitleFont:s.styles.cmsTitleFont||'display', cmsTitleSize:s.styles.cmsTitleSize||'3.75rem', cmsTitleColor:s.styles.cmsTitleColor||'#f4efe6',
      cmsIntroFont:s.styles.cmsIntroFont||'sans', cmsIntroSize:s.styles.cmsIntroSize||'15px', cmsIntroColor:s.styles.cmsIntroColor||'#f4efe6',
      cmsEmailFont:s.styles.cmsEmailFont||'display', cmsEmailSize:s.styles.cmsEmailSize||'1.5rem', cmsEmailColor:s.styles.cmsEmailColor||'#f4efe6',
      cmsFormFont:s.styles.cmsFormFont||'sans', cmsFormSize:s.styles.cmsFormSize||'14px', cmsFormColor:s.styles.cmsFormColor||'#f4efe6',
      indexCardBg:s.styles.indexCardBg||'#0d0c0b', indexCardRadius:s.styles.indexCardRadius||'0',
      indexCardTitleFont:s.styles.indexCardTitleFont||'display', indexCardTitleSize:s.styles.indexCardTitleSize||'1.5rem', indexCardTitleColor:s.styles.indexCardTitleColor||'#f4efe6',
      indexCardMetaFont:s.styles.indexCardMetaFont||'mono', indexCardMetaSize:s.styles.indexCardMetaSize||'9px', indexCardMetaColor:s.styles.indexCardMetaColor||'#f4efe6',
      pinDetailTitleFont:s.styles.pinDetailTitleFont||'display', pinDetailTitleSize:s.styles.pinDetailTitleSize||'3rem', pinDetailTitleColor:s.styles.pinDetailTitleColor||'#f4efe6',
      pinDetailMetaFont:s.styles.pinDetailMetaFont||'mono', pinDetailMetaSize:s.styles.pinDetailMetaSize||'10px', pinDetailMetaColor:s.styles.pinDetailMetaColor||'#f4efe6',
      pinDetailBodyFont:s.styles.pinDetailBodyFont||'sans', pinDetailBodySize:s.styles.pinDetailBodySize||'15px', pinDetailBodyColor:s.styles.pinDetailBodyColor||'#f4efe6',
      pinDetailQuoteFont:s.styles.pinDetailQuoteFont||'display', pinDetailQuoteSize:s.styles.pinDetailQuoteSize||'1.5rem', pinDetailQuoteColor:s.styles.pinDetailQuoteColor||'#f4efe6',
      pinDetailBg:s.styles.pinDetailBg||'#131110', pinDetailBgOpacity:(s.styles.pinDetailBgOpacity!==undefined?s.styles.pinDetailBgOpacity:0.95),
      loaderTitleFont:s.styles.loaderTitleFont||'display', loaderTitleColor:s.styles.loaderTitleColor||'#f4efe6',
      loaderMetaFont:s.styles.loaderMetaFont||'mono', loaderMetaSize:s.styles.loaderMetaSize||'10px', loaderMetaColor:s.styles.loaderMetaColor||'#f4efe6',
      loaderDescFont:s.styles.loaderDescFont||'sans', loaderDescSize:s.styles.loaderDescSize||'15px', loaderDescColor:s.styles.loaderDescColor||'#f4efe6',
      loaderBarColor:s.styles.loaderBarColor||'#E4572E', loaderBgOpacity:(s.styles.loaderBgOpacity!==undefined?s.styles.loaderBgOpacity:0.5),
      pinNavFont:s.styles.pinNavFont||'mono', pinNavSize:s.styles.pinNavSize||'10px', pinNavColor:s.styles.pinNavColor||'#f4efe6',
      overlayCloseItem:s.styles.overlayCloseItem||'mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60 hover:text-[#f4efe6]', pinCloseItem:s.styles.pinCloseItem||'mono absolute right-4 top-4 rounded-full border border-[#f4efe6]/30 bg-[#0d0c0b]/60 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#f4efe6] backdrop-blur hover:bg-[#E4572E] hover:text-[#0d0c0b]', indexHover:s.styles.indexHover||'#171513', overlayCloseHover:s.styles.overlayCloseHover||'#f4efe6', overlayCloseFont:s.styles.overlayCloseFont||'mono', overlayCloseSize:s.styles.overlayCloseSize||'10px', overlayCloseColor:s.styles.overlayCloseColor||'#f4efe6', indexToggleBg:s.styles.indexToggleBg||'transparent', indexToggleBorder:s.styles.indexToggleBorder||'transparent', indexToggleHover:s.styles.indexToggleHover||'#f4efe6',
      zoomPos:s.styles.zoomPos||'absolute right-5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-px overflow-hidden rounded-full border border-[#f4efe6]/20 bg-[#0d0c0b]/60 backdrop-blur'
    });
    state.renders.settings=s;
    if(!state.renders.pins) state.renders.pins=[];
    if(!state.renders.voices) state.renders.voices=[];
    if(state.renders.visits===undefined) state.renders.visits=12840;
  }
  function val(id, v){ const el=document.getElementById(id); if(el) el.value=v||''; }
  function renderRenders(){
    ensure();
    const r=state.renders; const s=r.settings;
    val('ren_sectionTitle', s.sectionTitle); const disp=document.getElementById('ren_sectionTitleDisplay'); if(disp) disp.textContent=s.sectionTitle||'Renders — Xlerion';
    val('ren_visits', r.visits); val('ren_mapImage', s.mapImage);
    val('ren_headerTitle', s.headerTitle); val('ren_headerSub', s.headerSubtitle);
    val('ren_navAbout', s.navAbout); val('ren_navVoices', s.navVoices); val('ren_navCms', s.navCms);
    val('ren_soundOn', s.soundOn); val('ren_soundOff', s.soundOff);
    val('ren_header_title_font', s.styles?.logoFont); val('ren_header_title_size', s.styles?.logoSize); val('ren_header_title_color', s.styles?.logoColor); val('ren_header_title_color_hex', s.styles?.logoColor); val('ren_header_title_weight', s.styles?.logoWeight);
    val('ren_header_subtitle_font', s.styles?.subtitleFont); val('ren_header_subtitle_size', s.styles?.subtitleSize); val('ren_header_subtitle_color', s.styles?.subtitleColor); val('ren_header_subtitle_color_hex', s.styles?.subtitleColor);
    val('ren_header_nav_font', s.styles?.navFont); val('ren_header_nav_size', s.styles?.navSize); val('ren_header_nav_color', s.styles?.navColor); val('ren_header_nav_color_hex', s.styles?.navColor);
    val('ren_header_sound_font', s.styles?.sndFont); val('ren_header_sound_color', s.styles?.sndTextColor); val('ren_header_sound_color_hex', s.styles?.sndTextColor);
    val('ren_loaderFlyTo', s.loaderFlyTo); val('ren_loaderTitle', s.loaderTitle); val('ren_loaderDesc', s.loaderDesc);
    val('ren_loaderLoading', s.loaderLoading); val('ren_loaderEnter', s.loaderEnter); val('ren_loaderCoords', s.loaderCoords); val('ren_loaderLocation', s.loaderLocation);
    val('ren_loaderPowered', s.loaderPowered); val('ren_loaderBg', s.loaderBg);
    val('ren_style_loaderTitleFont', s.styles?.loaderTitleFont); val('ren_style_loaderTitleColor', s.styles?.loaderTitleColor); val('ren_style_loaderTitleColor_hex', s.styles?.loaderTitleColor);
    val('ren_style_loaderMetaFont', s.styles?.loaderMetaFont); val('ren_style_loaderMetaSize', s.styles?.loaderMetaSize);
    val('ren_style_loaderMetaColor', s.styles?.loaderMetaColor); val('ren_style_loaderMetaColor_hex', s.styles?.loaderMetaColor);
    val('ren_style_loaderDescFont', s.styles?.loaderDescFont); val('ren_style_loaderDescSize', s.styles?.loaderDescSize);
    val('ren_style_loaderDescColor', s.styles?.loaderDescColor); val('ren_style_loaderDescColor_hex', s.styles?.loaderDescColor);
    val('ren_style_loaderBarColor', s.styles?.loaderBarColor); val('ren_style_loaderBarColor_hex', s.styles?.loaderBarColor);
    val('ren_style_loaderBgOpacity', s.styles?.loaderBgOpacity);
    val('ren_hint1', (s.hints||[])[0]); val('ren_hint2', (s.hints||[])[1]); val('ren_hint3', (s.hints||[])[2]);
    val('ren_indexCountSuffix', s.indexCountSuffix); val('ren_indexCountSuffix2', s.indexCountSuffix); val('ren_indexOpen', s.indexOpen); val('ren_indexHide', s.indexHide); val('ren_marquee', s.marquee);
    val('ren_aboutLabel', s.aboutLabel); val('ren_aboutTitle', s.aboutTitle); val('ren_aboutVideoLabel', s.aboutVideoLabel); val('ren_aboutVideoUrl', s.aboutVideoUrl);
    val('ren_aboutStat1k', s.aboutStats?.[0]?.k); val('ren_aboutStat1v', s.aboutStats?.[0]?.v);
    val('ren_aboutStat2k', s.aboutStats?.[1]?.k); val('ren_aboutStat2v', s.aboutStats?.[1]?.v);
    val('ren_aboutStat3k', s.aboutStats?.[2]?.k); val('ren_aboutStat3v', s.aboutStats?.[2]?.v);
    val('ren_aboutStat4k', s.aboutStats?.[3]?.k); val('ren_aboutStat4v', s.aboutStats?.[3]?.v);
    val('ren_aboutPara1', s.aboutParas?.[0]); val('ren_aboutPara2', s.aboutParas?.[1]); val('ren_aboutPara3', s.aboutParas?.[2]); val('ren_aboutHeroSub', s.aboutHeroSub);
    val('ren_aboutMeta1k', s.aboutMeta?.[0]?.k); val('ren_aboutMeta1v', s.aboutMeta?.[0]?.v);
    val('ren_aboutMeta2k', s.aboutMeta?.[1]?.k); val('ren_aboutMeta2v', s.aboutMeta?.[1]?.v);
    val('ren_aboutMeta3k', s.aboutMeta?.[2]?.k); val('ren_aboutMeta3v', s.aboutMeta?.[2]?.v);
    val('ren_voicesLabel', s.voicesLabel); val('ren_voicesTitle', s.voicesTitle); val('ren_voicesIntro', s.voicesIntro); val('ren_voicesVideoLabel', s.voicesVideoLabel); val('ren_voicesVideoUrl', s.voicesVideoUrl);
    val('ren_voicesNamePh', s.voicesNamePh); val('ren_voicesPlacePh', s.voicesPlacePh); val('ren_voicesMsgPh', s.voicesMsgPh); val('ren_voicesSubmit', s.voicesSubmit); val('ren_voicesSaving', s.voicesSaving);
    val('ren_cmsLabel', s.cmsLabel); val('ren_cmsTitle', s.cmsTitle); val('ren_cmsIntro', s.cmsIntro); val('ren_cmsVideoLabel', s.cmsVideoLabel); val('ren_cmsVideoUrl', s.cmsVideoUrl);
    val('ren_style_cmsTitleFont', s.styles?.cmsTitleFont); val('ren_style_cmsTitleSize', s.styles?.cmsTitleSize);
    val('ren_style_cmsTitleColor', s.styles?.cmsTitleColor); val('ren_style_cmsTitleColor_hex', s.styles?.cmsTitleColor);
    val('ren_style_cmsIntroFont', s.styles?.cmsIntroFont); val('ren_style_cmsIntroSize', s.styles?.cmsIntroSize);
    val('ren_style_cmsIntroColor', s.styles?.cmsIntroColor); val('ren_style_cmsIntroColor_hex', s.styles?.cmsIntroColor);
    val('ren_style_cmsEmailFont', s.styles?.cmsEmailFont); val('ren_style_cmsEmailSize', s.styles?.cmsEmailSize);
    val('ren_style_cmsEmailColor', s.styles?.cmsEmailColor); val('ren_style_cmsEmailColor_hex', s.styles?.cmsEmailColor);
    val('ren_style_cmsFormFont', s.styles?.cmsFormFont); val('ren_style_cmsFormSize', s.styles?.cmsFormSize);
    val('ren_style_cmsFormColor', s.styles?.cmsFormColor); val('ren_style_cmsFormColor_hex', s.styles?.cmsFormColor);
    val('ren_cmsEmail', s.cmsEmail); val('ren_cmsInfoTitle', s.cmsInfoTitle); val('ren_cmsInfoText', s.cmsInfoText);
    val('ren_cmsNamePh', s.cmsNamePh); val('ren_cmsEmailPh', s.cmsEmailPh); val('ren_cmsSubjectPh', s.cmsSubjectPh); val('ren_cmsMsgPh', s.cmsMsgPh);
    val('ren_cmsSubmit', s.cmsSubmit); val('ren_cmsSending', s.cmsSending); val('ren_cmsSent', s.cmsSent);
    val('ren_pinClose', s.pinClose); val('ren_pinPrev', s.pinPrev); val('ren_pinNext', s.pinNext); val('ren_overlayClose', s.overlayClose);
    val('ren_color_paper', s.colors?.paper); val('ren_color_paper_hex', s.colors?.paper);
    val('ren_color_ink', s.colors?.ink); val('ren_color_ink_hex', s.colors?.ink);
    val('ren_color_clay', s.colors?.clay); val('ren_color_clay_hex', s.colors?.clay);
    val('ren_style_navGap', s.styles?.navGap); val('ren_style_navItem', s.styles?.navItem);
    val('ren_style_subtitle', s.styles?.subtitle);     val('ren_style_pinBtn', s.styles?.pinBtn); val('ren_style_pinOpacity', s.styles?.pinOpacity); val('ren_style_pinColor', s.styles?.pinColor); val('ren_style_pinColor_hex', s.styles?.pinColor); val('ren_style_pinShape', s.styles?.pinShape);
    ['logoFont','logoSize','logoColor','logoColor_hex','logoWeight','subtitleFont','subtitleSize','subtitleColor','subtitleColor_hex','navFont','navSize','navColor','navColor_hex','indexFont','indexSize','indexColor','indexColor_hex','zoomBg','zoomBg_hex','zoomColor','zoomColor_hex','zoomBorder','zoomBorder_hex','zoomRadius','zoomPos','pinNavFont','pinNavSize','pinNavColor','pinNavColor_hex','pinNavItem','overlayCloseItem','overlayCloseHover','overlayCloseHover_hex','overlayCloseFont','overlayCloseSize','overlayCloseColor','overlayCloseColor_hex','pinCloseItem','indexHover','indexHover_hex'].forEach(k=>val('ren_style_'+k, s.styles?.[k.replace('_hex','')]));
    val('ren_style_pinBg', s.styles?.pinBg); val('ren_style_pinBg_hex', s.styles?.pinBg); val('ren_style_pinBgOpacity', s.styles?.pinBgOpacity);
    val('ren_style_indexCardBg', s.styles?.indexCardBg); val('ren_style_indexCardBg_hex', s.styles?.indexCardBg); val('ren_style_indexCardRadius', s.styles?.indexCardRadius);
    val('ren_style_indexCardTitleFont', s.styles?.indexCardTitleFont); val('ren_style_indexCardTitleSize', s.styles?.indexCardTitleSize);
    val('ren_style_indexCardTitleColor', s.styles?.indexCardTitleColor); val('ren_style_indexCardTitleColor_hex', s.styles?.indexCardTitleColor);
    val('ren_style_indexCardMetaFont', s.styles?.indexCardMetaFont); val('ren_style_indexCardMetaSize', s.styles?.indexCardMetaSize);
    val('ren_style_indexCardMetaColor', s.styles?.indexCardMetaColor); val('ren_style_indexCardMetaColor_hex', s.styles?.indexCardMetaColor);
    val('ren_style_pinDetailTitleFont', s.styles?.pinDetailTitleFont); val('ren_style_pinDetailTitleSize', s.styles?.pinDetailTitleSize);
    val('ren_style_pinDetailTitleColor', s.styles?.pinDetailTitleColor); val('ren_style_pinDetailTitleColor_hex', s.styles?.pinDetailTitleColor);
    val('ren_style_pinDetailMetaFont', s.styles?.pinDetailMetaFont); val('ren_style_pinDetailMetaSize', s.styles?.pinDetailMetaSize);
    val('ren_style_pinDetailMetaColor', s.styles?.pinDetailMetaColor); val('ren_style_pinDetailMetaColor_hex', s.styles?.pinDetailMetaColor);
    val('ren_style_pinDetailBodyFont', s.styles?.pinDetailBodyFont); val('ren_style_pinDetailBodySize', s.styles?.pinDetailBodySize);
    val('ren_style_pinDetailBodyColor', s.styles?.pinDetailBodyColor); val('ren_style_pinDetailBodyColor_hex', s.styles?.pinDetailBodyColor);
    val('ren_style_pinDetailQuoteFont', s.styles?.pinDetailQuoteFont); val('ren_style_pinDetailQuoteSize', s.styles?.pinDetailQuoteSize);
    val('ren_style_pinDetailQuoteColor', s.styles?.pinDetailQuoteColor); val('ren_style_pinDetailQuoteColor_hex', s.styles?.pinDetailQuoteColor);
    val('ren_style_pinDetailBg', s.styles?.pinDetailBg); val('ren_style_pinDetailBg_hex', s.styles?.pinDetailBg); val('ren_style_pinDetailBgOpacity', s.styles?.pinDetailBgOpacity);
    val('ren_style_indexToggleBg', /^#[0-9a-fA-F]{6}$/.test(s.styles?.indexToggleBg||'')?s.styles.indexToggleBg:'#000000');
    val('ren_style_indexToggleBg_hex', s.styles?.indexToggleBg==='transparent'?'transparent':'picker');
    val('ren_style_indexToggleBorder', /^#[0-9a-fA-F]{6}$/.test(s.styles?.indexToggleBorder||'')?s.styles.indexToggleBorder:'#000000');
    val('ren_style_indexToggleBorder_hex', s.styles?.indexToggleBorder==='transparent'?'transparent':'picker');
    val('ren_style_indexToggleHover', s.styles?.indexToggleHover); val('ren_style_indexToggleHover_hex', s.styles?.indexToggleHover);
    val('ren_style_pinPulseOpacity', s.styles?.pinPulseOpacity); val('ren_style_pinPulseScale', s.styles?.pinPulseScale); val('ren_style_pinPulseColor', s.styles?.pinPulseColor); val('ren_style_pinPulseColor_hex', s.styles?.pinPulseColor);
    val('ren_style_featPin', s.styles?.featPin ?? 0); val('ren_style_featScale', s.styles?.featScale); val('ren_style_featRing', s.styles?.featRing); val('ren_style_featRing_hex', s.styles?.featRing);
    val('ren_style_indexToggle', s.styles?.indexToggle); val('ren_style_soundBtn', s.styles?.soundBtn); val('ren_style_hint', s.styles?.hint); val('ren_style_loaderTitle', s.styles?.loaderTitle); val('ren_style_btnFill', s.styles?.btnFill);
    val('ren_style_sndText', s.styles?.sndTextColor); val('ren_style_sndText_hex', s.styles?.sndTextColor);
    val('ren_style_sndBorder', s.styles?.sndBorderColor); val('ren_style_sndBorder_hex', s.styles?.sndBorderColor);
    val('ren_style_sndBg', s.styles?.sndBg); val('ren_style_sndFont', s.styles?.sndFont); val('ren_style_sndSize', s.styles?.sndSize);
    val('ren_style_sndIcon', s.styles?.sndIcon);
    val('ren_style_btnText', s.styles?.btnTextColor); val('ren_style_btnText_hex', s.styles?.btnTextColor);
    val('ren_style_btnBorder', s.styles?.btnBorderColor); val('ren_style_btnBorder_hex', s.styles?.btnBorderColor);
    val('ren_style_btnFillColor', s.styles?.btnFillColor); val('ren_style_btnFillColor_hex', s.styles?.btnFillColor);
    val('ren_style_btnBg', s.styles?.btnBg); val('ren_style_btnFont', s.styles?.btnFont); val('ren_style_btnSize', s.styles?.btnSize);
    val('ren_style_btnIcon', s.styles?.btnIcon); val('ren_style_btnIconPos', s.styles?.btnIconPos);
    const dg=(typeof state!=='undefined'&&state&&state.design)||{};
    val('ren_design_bg', dg.bg||'#0a0a0f'); val('ren_design_bg_hex', dg.bg||'#0a0a0f');
    val('ren_design_bg2', dg.bg2||'#12121a'); val('ren_design_bg2_hex', dg.bg2||'#12121a');
    val('ren_design_bg3', dg.bg3||'#1a1a25'); val('ren_design_bg3_hex', dg.bg3||'#1a1a25');
    val('ren_design_bg_card', dg.bg_card||'#16161f'); val('ren_design_bg_card_hex', dg.bg_card||'#16161f');
    val('ren_design_text', dg.texto||'#f0f0f5'); val('ren_design_text_hex', dg.texto||'#f0f0f5');
    val('ren_design_text2', dg.text2||'#a0a0b5'); val('ren_design_text2_hex', dg.text2||'#a0a0b5');
    val('ren_design_muted', dg.muted||'#6a6a80'); val('ren_design_muted_hex', dg.muted||'#6a6a80');
    val('ren_design_border', dg.border||'#2a2a3a'); val('ren_design_border_hex', dg.border||'#2a2a3a');
    val('ren_design_border_hover', dg.border_hover||'#3a3a4f'); val('ren_design_border_hover_hex', dg.border_hover||'#3a3a4f');
    val('ren_design_accent', dg.accent||'#4f8cff'); val('ren_design_accent_hex', dg.accent||'#4f8cff');
    val('ren_design_accent2', dg.accent2||'#a855f7'); val('ren_design_accent2_hex', dg.accent2||'#a855f7');
    val('ren_design_accent_emerald', dg.accent_emerald||'#10b981'); val('ren_design_accent_emerald_hex', dg.accent_emerald||'#10b981');
    val('ren_design_accent_amber', dg.accent_amber||'#f59e0b'); val('ren_design_accent_amber_hex', dg.accent_amber||'#f59e0b');
    val('ren_design_accent_rose', dg.accent_rose||'#f43f5e'); val('ren_design_accent_rose_hex', dg.accent_rose||'#f43f5e');
    val('ren_design_accent_cyan', dg.accent_cyan||'#06b6d4'); val('ren_design_accent_cyan_hex', dg.accent_cyan||'#06b6d4');
    val('ren_design_grad_from', dg.grad_from||'#4f8cff'); val('ren_design_grad_from_hex', dg.grad_from||'#4f8cff');
    val('ren_design_grad_mid', dg.grad_mid||'#a855f7'); val('ren_design_grad_mid_hex', dg.grad_mid||'#a855f7');
    val('ren_design_grad_to', dg.grad_to||'#a855f7'); val('ren_design_grad_to_hex', dg.grad_to||'#a855f7');
    const pl=document.getElementById('ren_pins_list');
    if(pl){
      pl.innerHTML=(r.pins||[]).map((p,i)=>`<div class="panel" style="background:var(--panel2)"><div class="grid2"><div class="field"><label>Titulo</label><input data-k="ren_pin_title" data-i="${i}" value="${(p.title||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Slug</label><input data-k="ren_pin_slug" data-i="${i}" value="${(p.slug||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Num</label><input type="number" data-k="ren_pin_number" data-i="${i}" value="${p.number||i+1}"></div><div class="field"><label>Categoria</label><input data-k="ren_pin_cat" data-i="${i}" value="${(p.category||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Acento</label><input type="color" data-k="ren_pin_accent" data-i="${i}" value="${p.accent||'#E4572E'}"></div><div class="field"><label>X %</label><input type="number" step="0.1" data-k="ren_pin_x" data-i="${i}" value="${p.x||50}"></div><div class="field"><label>Y %</label><input type="number" step="0.1" data-k="ren_pin_y" data-i="${i}" value="${p.y||50}"></div><div class="field"><label>Imagen</label><input data-k="ren_pin_img" data-i="${i}" value="${(p.imageUrl||'').replace(/"/g,'&quot;')}"><input type="file" accept="image/*" data-up="ren_pin_img" data-i="${i}" style="margin-top:6px"></div></div><div class="field"><label>Subtitulo</label><input data-k="ren_pin_sub" data-i="${i}" value="${(p.subtitle||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Artista</label><input data-k="ren_pin_artist" data-i="${i}" value="${(p.artist||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Body</label><textarea data-k="ren_pin_body" data-i="${i}" rows="2">${p.body||''}</textarea></div><div class="field"><label>Quote</label><input data-k="ren_pin_quote" data-i="${i}" value="${(p.quote||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Autor quote</label><input data-k="ren_pin_qa" data-i="${i}" value="${(p.quoteAuthor||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Video YouTube (vacío = ocultar)</label><input data-k="ren_pin_video" data-i="${i}" value="${(p.videoUrl||'').replace(/"/g,'&quot;')}" placeholder="https://www.youtube.com/watch?v=..."></div><button class="btn danger small" data-del="ren_pin" data-i="${i}">Eliminar pin</button></div>`).join('');
    }
    const vl=document.getElementById('ren_voices_list');
    if(vl){
      vl.innerHTML=(r.voices||[]).map((v,i)=>`<div class="item"><div class="grow grid2"><input data-k="ren_voice_name" data-i="${i}" value="${(v.name||'').replace(/"/g,'&quot;')}" placeholder="Nombre"><input data-k="ren_voice_place" data-i="${i}" value="${(v.place||'').replace(/"/g,'&quot;')}" placeholder="Lugar"><textarea data-k="ren_voice_msg" data-i="${i}" rows="2" placeholder="Mensaje" class="col-span-2">${v.message||''}</textarea></div><button class="btn ghost small" data-del="ren_voice" data-i="${i}">x</button></div>`).join('');
    }
  }
  const orig = window.renderAll;
  if(orig){
    window.renderAll = function(){ orig(); try{renderRenders()}catch(e){console.error(e)} };
    setTimeout(renderRenders,600);
  } else {
    document.addEventListener('DOMContentLoaded', renderRenders);
  }
  // collect renders settings into state — called by collectFromDOM BEFORE save/publish
  function collectRendersSettings(){
      // collect renders settings
      if(!state.renders) return;
      if(!state.renders.settings) state.renders.settings={};
      const s=state.renders.settings;
      const v=(id)=>document.getElementById(id)?.value;
      s.sectionTitle=v('ren_sectionTitle'); state.renders.visits=Number(v('ren_visits'))||12840;
      s.mapImage=v('ren_mapImage');
      s.headerTitle=v('ren_headerTitle'); s.headerSubtitle=v('ren_headerSub');
      s.navAbout=v('ren_navAbout'); s.navVoices=v('ren_navVoices'); s.navCms=v('ren_navCms');
      s.soundOn=v('ren_soundOn'); s.soundOff=v('ren_soundOff');
      s.loaderFlyTo=v('ren_loaderFlyTo'); s.loaderTitle=v('ren_loaderTitle'); s.loaderDesc=v('ren_loaderDesc');
      s.loaderLoading=v('ren_loaderLoading'); s.loaderEnter=v('ren_loaderEnter'); s.loaderCoords=v('ren_loaderCoords'); s.loaderLocation=v('ren_loaderLocation');
      s.loaderPowered=v('ren_loaderPowered'); s.loaderBg=v('ren_loaderBg');
      s.styles.loaderTitleFont=v('ren_style_loaderTitleFont')||s.styles.loaderTitleFont; s.styles.loaderTitleColor=v('ren_style_loaderTitleColor')||s.styles.loaderTitleColor;
      s.styles.loaderMetaFont=v('ren_style_loaderMetaFont')||s.styles.loaderMetaFont; s.styles.loaderMetaSize=v('ren_style_loaderMetaSize')||s.styles.loaderMetaSize; s.styles.loaderMetaColor=v('ren_style_loaderMetaColor')||s.styles.loaderMetaColor;
      s.styles.loaderDescFont=v('ren_style_loaderDescFont')||s.styles.loaderDescFont; s.styles.loaderDescSize=v('ren_style_loaderDescSize')||s.styles.loaderDescSize; s.styles.loaderDescColor=v('ren_style_loaderDescColor')||s.styles.loaderDescColor;
      s.styles.loaderBarColor=v('ren_style_loaderBarColor')||s.styles.loaderBarColor;
      { const lbo=parseFloat(v('ren_style_loaderBgOpacity')); if(!isNaN(lbo)) s.styles.loaderBgOpacity=lbo; }
      s.hints=[v('ren_hint1'),v('ren_hint2'),v('ren_hint3')].filter(Boolean);
      s.indexCountSuffix=v('ren_indexCountSuffix2')||v('ren_indexCountSuffix'); s.indexOpen=v('ren_indexOpen'); s.indexHide=v('ren_indexHide'); s.marquee=v('ren_marquee');
      s.aboutLabel=v('ren_aboutLabel'); s.aboutTitle=v('ren_aboutTitle');
      s.aboutStats=[{k:v('ren_aboutStat1k'),v:v('ren_aboutStat1v')},{k:v('ren_aboutStat2k'),v:v('ren_aboutStat2v')},{k:v('ren_aboutStat3k'),v:v('ren_aboutStat3v')},{k:v('ren_aboutStat4k'),v:v('ren_aboutStat4v')}];
      s.aboutParas=[v('ren_aboutPara1'),v('ren_aboutPara2'),v('ren_aboutPara3')]; s.aboutHeroSub=v('ren_aboutHeroSub');
      s.aboutMeta=[{k:v('ren_aboutMeta1k'),v:v('ren_aboutMeta1v')},{k:v('ren_aboutMeta2k'),v:v('ren_aboutMeta2v')},{k:v('ren_aboutMeta3k'),v:v('ren_aboutMeta3v')}];
     s.aboutVideoLabel=v('ren_aboutVideoLabel'); if(s.aboutVideoLabel===undefined) s.aboutVideoLabel='film'; s.aboutVideoUrl=v('ren_aboutVideoUrl')||'';
      s.voicesLabel=v('ren_voicesLabel'); s.voicesTitle=v('ren_voicesTitle'); s.voicesIntro=v('ren_voicesIntro'); s.voicesVideoLabel=v('ren_voicesVideoLabel'); if(s.voicesVideoLabel===undefined) s.voicesVideoLabel='film'; s.voicesVideoUrl=v('ren_voicesVideoUrl')||'';
      s.voicesNamePh=v('ren_voicesNamePh'); s.voicesPlacePh=v('ren_voicesPlacePh'); s.voicesMsgPh=v('ren_voicesMsgPh'); s.voicesSubmit=v('ren_voicesSubmit'); s.voicesSaving=v('ren_voicesSaving');
      s.cmsLabel=v('ren_cmsLabel'); s.cmsTitle=v('ren_cmsTitle'); s.cmsIntro=v('ren_cmsIntro'); s.cmsVideoLabel=v('ren_cmsVideoLabel'); if(s.cmsVideoLabel===undefined) s.cmsVideoLabel='film'; s.cmsVideoUrl=v('ren_cmsVideoUrl')||'';
      s.styles.cmsTitleFont=v('ren_style_cmsTitleFont')||s.styles.cmsTitleFont; s.styles.cmsTitleSize=v('ren_style_cmsTitleSize')||s.styles.cmsTitleSize; s.styles.cmsTitleColor=v('ren_style_cmsTitleColor')||s.styles.cmsTitleColor;
      s.styles.cmsIntroFont=v('ren_style_cmsIntroFont')||s.styles.cmsIntroFont; s.styles.cmsIntroSize=v('ren_style_cmsIntroSize')||s.styles.cmsIntroSize; s.styles.cmsIntroColor=v('ren_style_cmsIntroColor')||s.styles.cmsIntroColor;
      s.styles.cmsEmailFont=v('ren_style_cmsEmailFont')||s.styles.cmsEmailFont; s.styles.cmsEmailSize=v('ren_style_cmsEmailSize')||s.styles.cmsEmailSize; s.styles.cmsEmailColor=v('ren_style_cmsEmailColor')||s.styles.cmsEmailColor;
      s.styles.cmsFormFont=v('ren_style_cmsFormFont')||s.styles.cmsFormFont; s.styles.cmsFormSize=v('ren_style_cmsFormSize')||s.styles.cmsFormSize; s.styles.cmsFormColor=v('ren_style_cmsFormColor')||s.styles.cmsFormColor;
      s.cmsEmail=v('ren_cmsEmail')||s.cmsEmail; s.cmsInfoTitle=v('ren_cmsInfoTitle'); if(s.cmsInfoTitle===undefined) s.cmsInfoTitle='información · contacto'; s.cmsInfoText=v('ren_cmsInfoText'); if(s.cmsInfoText===undefined) s.cmsInfoText='';
      s.cmsNamePh=v('ren_cmsNamePh'); if(s.cmsNamePh===undefined) s.cmsNamePh='Tu nombre *'; s.cmsEmailPh=v('ren_cmsEmailPh'); if(s.cmsEmailPh===undefined) s.cmsEmailPh='Tu correo *';
      s.cmsSubjectPh=v('ren_cmsSubjectPh'); if(s.cmsSubjectPh===undefined) s.cmsSubjectPh='Asunto'; s.cmsMsgPh=v('ren_cmsMsgPh'); if(s.cmsMsgPh===undefined) s.cmsMsgPh='Tu mensaje…';
      s.cmsSubmit=v('ren_cmsSubmit'); if(s.cmsSubmit===undefined) s.cmsSubmit='enviar mensaje'; s.cmsSending=v('ren_cmsSending'); if(s.cmsSending===undefined) s.cmsSending='enviando…'; s.cmsSent=v('ren_cmsSent'); if(s.cmsSent===undefined) s.cmsSent='¡Gracias! Se abrió tu correo con el mensaje listo para enviar.';
      s.pinClose=v('ren_pinClose'); s.pinPrev=v('ren_pinPrev'); s.pinNext=v('ren_pinNext');
      s.colors={paper:v('ren_color_paper'),ink:v('ren_color_ink'),clay:v('ren_color_clay')};
      if(!s.styles) s.styles={};
      s.styles.navGap=v('ren_style_navGap'); s.styles.navItem=v('ren_style_navItem'); s.styles.subtitle=v('ren_style_subtitle'); s.styles.topBar=v('ren_style_topBar');
      s.styles.pinBtn=v('ren_style_pinBtn'); s.styles.pinOpacity=parseFloat(v('ren_style_pinOpacity')); if(isNaN(s.styles.pinOpacity)) s.styles.pinOpacity=1; s.styles.pinColor=v('ren_style_pinColor'); s.styles.pinShape=v('ren_style_pinShape');
      ['logoFont','logoSize','logoColor','logoWeight','subtitleFont','subtitleSize','subtitleColor','navFont','navSize','navColor','indexFont','indexSize','indexColor','zoomBg','zoomColor','zoomBorder','zoomRadius','zoomPos','pinNavFont','pinNavSize','pinNavColor','pinNavItem','indexCardBg','indexCardRadius','indexCardTitleFont','indexCardTitleSize','indexCardTitleColor','indexCardMetaFont','indexCardMetaSize','indexCardMetaColor'].forEach(k=>{ const vv=v('ren_style_'+k); if(vv!==undefined&&vv!=='') s.styles[k]=vv; });
      s.styles.logoFont=v('ren_header_title_font')||s.styles.logoFont; s.styles.logoSize=v('ren_header_title_size')||s.styles.logoSize; s.styles.logoColor=v('ren_header_title_color')||s.styles.logoColor; s.styles.logoWeight=v('ren_header_title_weight')||s.styles.logoWeight;
      s.styles.subtitleFont=v('ren_header_subtitle_font')||s.styles.subtitleFont; s.styles.subtitleSize=v('ren_header_subtitle_size')||s.styles.subtitleSize; s.styles.subtitleColor=v('ren_header_subtitle_color')||s.styles.subtitleColor;
      s.styles.navFont=v('ren_header_nav_font')||s.styles.navFont; s.styles.navSize=v('ren_header_nav_size')||s.styles.navSize; s.styles.navColor=v('ren_header_nav_color')||s.styles.navColor;
      s.styles.sndFont=v('ren_header_sound_font')||s.styles.sndFont; s.styles.sndTextColor=v('ren_header_sound_color')||s.styles.sndTextColor;
      s.styles.pinBg=v('ren_style_pinBg'); s.styles.pinBgOpacity=parseFloat(v('ren_style_pinBgOpacity')); if(isNaN(s.styles.pinBgOpacity)) s.styles.pinBgOpacity=0.6;
      s.styles.pinDetailTitleFont=v('ren_style_pinDetailTitleFont')||s.styles.pinDetailTitleFont; s.styles.pinDetailTitleSize=v('ren_style_pinDetailTitleSize')||s.styles.pinDetailTitleSize; s.styles.pinDetailTitleColor=v('ren_style_pinDetailTitleColor')||s.styles.pinDetailTitleColor;
      s.styles.pinDetailMetaFont=v('ren_style_pinDetailMetaFont')||s.styles.pinDetailMetaFont; s.styles.pinDetailMetaSize=v('ren_style_pinDetailMetaSize')||s.styles.pinDetailMetaSize; s.styles.pinDetailMetaColor=v('ren_style_pinDetailMetaColor')||s.styles.pinDetailMetaColor;
      s.styles.pinDetailBodyFont=v('ren_style_pinDetailBodyFont')||s.styles.pinDetailBodyFont; s.styles.pinDetailBodySize=v('ren_style_pinDetailBodySize')||s.styles.pinDetailBodySize; s.styles.pinDetailBodyColor=v('ren_style_pinDetailBodyColor')||s.styles.pinDetailBodyColor;
      s.styles.pinDetailQuoteFont=v('ren_style_pinDetailQuoteFont')||s.styles.pinDetailQuoteFont; s.styles.pinDetailQuoteSize=v('ren_style_pinDetailQuoteSize')||s.styles.pinDetailQuoteSize; s.styles.pinDetailQuoteColor=v('ren_style_pinDetailQuoteColor')||s.styles.pinDetailQuoteColor;
      s.styles.pinDetailBg=v('ren_style_pinDetailBg')||s.styles.pinDetailBg;
      { const pbo=parseFloat(v('ren_style_pinDetailBgOpacity')); if(!isNaN(pbo)) s.styles.pinDetailBgOpacity=pbo; }
      s.styles.pinPulseOpacity=parseFloat(v('ren_style_pinPulseOpacity')); if(isNaN(s.styles.pinPulseOpacity)) s.styles.pinPulseOpacity=0.5; s.styles.pinPulseScale=parseFloat(v('ren_style_pinPulseScale')); if(isNaN(s.styles.pinPulseScale)) s.styles.pinPulseScale=1; s.styles.pinPulseColor=v('ren_style_pinPulseColor')||'';
      s.styles.featPin=parseInt(v('ren_style_featPin'))||0; s.styles.featScale=v('ren_style_featScale'); s.styles.featRing=v('ren_style_featRing'); s.styles.indexToggle=v('ren_style_indexToggle'); s.styles.soundBtn=v('ren_style_soundBtn'); s.styles.hint=v('ren_style_hint'); s.styles.loaderTitle=v('ren_style_loaderTitle'); s.styles.btnFill=v('ren_style_btnFill');
      s.styles.sndTextColor=v('ren_style_sndText'); s.styles.sndBorderColor=v('ren_style_sndBorder');
      s.styles.sndBg=v('ren_style_sndBg'); s.styles.sndFont=v('ren_style_sndFont'); s.styles.sndSize=v('ren_style_sndSize');
      s.styles.sndIcon=v('ren_style_sndIcon');
      s.styles.btnTextColor=v('ren_style_btnText'); s.styles.btnBorderColor=v('ren_style_btnBorder'); s.styles.btnFillColor=v('ren_style_btnFillColor');
      s.styles.btnBg=v('ren_style_btnBg'); s.styles.btnFont=v('ren_style_btnFont'); s.styles.btnSize=v('ren_style_btnSize');
      s.styles.btnIcon=v('ren_style_btnIcon'); s.styles.btnIconPos=v('ren_style_btnIconPos');
      s.overlayClose=v('ren_overlayClose')||s.overlayClose;
      s.styles.overlayCloseItem=v('ren_style_overlayCloseItem')||s.styles.overlayCloseItem; s.styles.overlayCloseHover=v('ren_style_overlayCloseHover')||s.styles.overlayCloseHover; s.styles.overlayCloseFont=v('ren_style_overlayCloseFont')||s.styles.overlayCloseFont; s.styles.overlayCloseSize=v('ren_style_overlayCloseSize')||s.styles.overlayCloseSize; s.styles.overlayCloseColor=v('ren_style_overlayCloseColor')||s.styles.overlayCloseColor;       const bgMode=v('ren_style_indexToggleBg_hex'), bdMode=v('ren_style_indexToggleBorder_hex');
      s.styles.indexToggleBg=bgMode==='transparent'?'transparent':(v('ren_style_indexToggleBg')||s.styles.indexToggleBg);
      s.styles.indexToggleBorder=bdMode==='transparent'?'transparent':(v('ren_style_indexToggleBorder')||s.styles.indexToggleBorder);
      s.styles.indexToggleHover=v('ren_style_indexToggleHover')||s.styles.indexToggleHover; s.styles.pinCloseItem=v('ren_style_pinCloseItem')||s.styles.pinCloseItem; s.styles.indexHover=v('ren_style_indexHover')||s.styles.indexHover;
      if(!state.design) state.design={};
      const dd=state.design;
      const mainV=(id)=>{const el=document.getElementById(id);return el?el.value:undefined;};
      const syncD=(key,renId,mainId)=>{const rv=v(renId),mv=mainV(mainId);if(mv!==undefined&&mv!==dd[key]&&(rv===dd[key]||rv===undefined))return;if(rv!==undefined)dd[key]=rv;};
      syncD('bg','ren_design_bg','d_bg');syncD('bg2','ren_design_bg2','d_bg2');syncD('bg3','ren_design_bg3','d_bg3');syncD('bg_card','ren_design_bg_card','d_bg_card');
      syncD('texto','ren_design_text','d_text');syncD('text2','ren_design_text2','d_text2');syncD('muted','ren_design_muted','d_muted');
      syncD('border','ren_design_border','d_border');syncD('border_hover','ren_design_border_hover','d_border_hover');
      syncD('accent','ren_design_accent','d_accent');syncD('accent2','ren_design_accent2','d_accent2');syncD('accent_emerald','ren_design_accent_emerald','d_accent_emerald');
      syncD('accent_amber','ren_design_accent_amber','d_accent_amber');syncD('accent_rose','ren_design_accent_rose','d_accent_rose');syncD('accent_cyan','ren_design_accent_cyan','d_accent_cyan');
      syncD('grad_from','ren_design_grad_from','d_grad_from');syncD('grad_mid','ren_design_grad_mid','d_grad_mid');syncD('grad_to','ren_design_grad_to','d_grad_to');
  }
  window.collectRendersSettings=collectRendersSettings;
  // collect on save — hook into saveAllBtn (redundant safety; collectFromDOM already calls collectRendersSettings first)
  const saveBtn=document.getElementById('saveAllBtn');
  if(saveBtn){
    saveBtn.addEventListener('click', ()=>{ collectRendersSettings(); }, true);
  }
  const visualStyleInputs=['ren_header_title_font','ren_header_title_size','ren_header_title_color','ren_header_title_weight','ren_header_subtitle_font','ren_header_subtitle_size','ren_header_subtitle_color','ren_header_nav_font','ren_header_nav_size','ren_header_nav_color','ren_header_sound_font','ren_header_sound_color','ren_style_navGap','ren_style_navItem','ren_style_subtitle','ren_style_topBar','ren_style_logoFont','ren_style_logoSize','ren_style_logoColor','ren_style_logoColor_hex','ren_style_logoWeight','ren_style_subtitleFont','ren_style_subtitleSize','ren_style_subtitleColor','ren_style_subtitleColor_hex','ren_style_navFont','ren_style_navSize','ren_style_navColor','ren_style_navColor_hex','ren_style_sndFont','ren_style_sndText','ren_style_sndText_hex','ren_style_indexFont','ren_style_indexSize','ren_style_indexColor','ren_style_indexColor_hex','ren_style_zoomBg','ren_style_zoomBg_hex','ren_style_zoomColor','ren_style_zoomColor_hex','ren_style_zoomBorder','ren_style_zoomBorder_hex','ren_style_zoomRadius','ren_style_zoomPos','ren_style_indexCardBg','ren_style_indexCardBg_hex','ren_style_indexCardRadius','ren_style_indexCardTitleFont','ren_style_indexCardTitleSize','ren_style_indexCardTitleColor','ren_style_indexCardTitleColor_hex','ren_style_indexCardMetaFont','ren_style_indexCardMetaSize','ren_style_indexCardMetaColor','ren_style_indexCardMetaColor_hex','ren_style_pinNavFont','ren_style_pinNavSize','ren_style_pinNavColor','ren_style_pinNavColor_hex','ren_style_pinNavItem','ren_style_overlayCloseItem','ren_style_overlayCloseHover','ren_style_overlayCloseHover_hex','ren_style_overlayCloseFont','ren_style_overlayCloseSize','ren_style_overlayCloseColor','ren_style_overlayCloseColor_hex','ren_style_cmsTitleFont','ren_style_cmsTitleSize','ren_style_cmsTitleColor','ren_style_cmsTitleColor_hex','ren_style_cmsIntroFont','ren_style_cmsIntroSize','ren_style_cmsIntroColor','ren_style_cmsIntroColor_hex','ren_style_cmsEmailFont','ren_style_cmsEmailSize','ren_style_cmsEmailColor','ren_style_cmsEmailColor_hex','ren_style_cmsFormFont','ren_style_cmsFormSize','ren_style_cmsFormColor','ren_style_cmsFormColor_hex','ren_style_loaderTitleFont','ren_style_loaderTitleColor','ren_style_loaderTitleColor_hex','ren_style_loaderMetaFont','ren_style_loaderMetaSize','ren_style_loaderMetaColor','ren_style_loaderMetaColor_hex','ren_style_loaderDescFont','ren_style_loaderDescSize','ren_style_loaderDescColor','ren_style_loaderDescColor_hex','ren_style_loaderBarColor','ren_style_loaderBarColor_hex','ren_style_loaderBgOpacity','ren_style_indexToggleBg','ren_style_indexToggleBg_hex','ren_style_indexToggleBorder','ren_style_indexToggleBorder_hex','ren_style_indexToggleHover','ren_style_indexToggleHover_hex','ren_style_pinCloseItem','ren_style_indexHover','ren_style_indexHover_hex','ren_style_pinBtn','ren_style_pinOpacity','ren_style_pinColor','ren_style_pinColor_hex','ren_style_pinShape','ren_style_pinBg','ren_style_pinBg_hex','ren_style_pinBgOpacity','ren_style_pinDetailTitleFont','ren_style_pinDetailTitleSize','ren_style_pinDetailTitleColor','ren_style_pinDetailTitleColor_hex','ren_style_pinDetailMetaFont','ren_style_pinDetailMetaSize','ren_style_pinDetailMetaColor','ren_style_pinDetailMetaColor_hex','ren_style_pinDetailBodyFont','ren_style_pinDetailBodySize','ren_style_pinDetailBodyColor','ren_style_pinDetailBodyColor_hex','ren_style_pinDetailQuoteFont','ren_style_pinDetailQuoteSize','ren_style_pinDetailQuoteColor','ren_style_pinDetailQuoteColor_hex','ren_style_pinDetailBg','ren_style_pinDetailBg_hex','ren_style_pinDetailBgOpacity','ren_style_pinPulseOpacity','ren_style_pinPulseScale','ren_style_pinPulseColor','ren_style_pinPulseColor_hex','ren_style_featPin','ren_style_featScale','ren_style_featRing','ren_style_featRing_hex','ren_style_indexToggle','ren_style_soundBtn','ren_style_hint','ren_style_loaderTitle','ren_style_btnFill','ren_style_sndText','ren_style_sndText_hex','ren_style_sndBorder','ren_style_sndBorder_hex','ren_style_sndBg','ren_style_sndFont','ren_style_sndSize','ren_style_sndIcon','ren_style_btnText','ren_style_btnText_hex','ren_style_btnBorder','ren_style_btnBorder_hex','ren_style_btnFillColor','ren_style_btnFillColor_hex','ren_style_btnBg','ren_style_btnFont','ren_style_btnSize','ren_style_btnIcon','ren_style_btnIconPos'];
  const syncVisualStyles=()=>{
    collectRendersSettings();
    try{ localStorage.setItem('portfolio',JSON.stringify(state)); localStorage.setItem('pa_portfolio',JSON.stringify(state)); }catch{}
    fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}).catch(()=>{});
    renderMapPreview();
    const iframe=document.getElementById('ren_livePreview');
    if(iframe?.contentWindow) iframe.contentWindow.postMessage({type:'portfolio-update',data:JSON.parse(JSON.stringify(state))},'*');
  };
  visualStyleInputs.forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener('input',syncVisualStyles);
    el.addEventListener('change',syncVisualStyles);
  });
  document.addEventListener('change', e=>{
    if(visualStyleInputs.includes(e.target.id)) syncVisualStyles();
  });
  document.addEventListener('input', e=>{
    if(visualStyleInputs.includes(e.target.id)) syncVisualStyles();
  });
  // two-way sync: Renders "Diseño" mirror <-> main Design tab (same state.design)
  const DESIGN_KEYS=['bg','bg2','bg3','bg_card','text','text2','muted','border','border_hover','accent','accent2','accent_emerald','accent_amber','accent_rose','accent_cyan','grad_from','grad_mid','grad_to'];
  const mainIdFor=(k)=>'d_'+k;
  // two-way sync: "Componentes de interfaz" typography <-> Header panel (same s.styles.*)
  const TYPE_PAIRS=[['ren_style_logoFont','ren_header_title_font'],['ren_style_logoSize','ren_header_title_size'],['ren_style_logoColor','ren_header_title_color'],['ren_style_logoWeight','ren_header_title_weight'],['ren_style_subtitleFont','ren_header_subtitle_font'],['ren_style_subtitleSize','ren_header_subtitle_size'],['ren_style_subtitleColor','ren_header_subtitle_color'],['ren_style_navFont','ren_header_nav_font'],['ren_style_navSize','ren_header_nav_size'],['ren_style_navColor','ren_header_nav_color'],['ren_style_sndFont','ren_header_sound_font'],['ren_style_sndText','ren_header_sound_color']];
  const pairFor=(id)=>{const b=id.replace(/_hex$/,'');for(const [a,c] of TYPE_PAIRS){if(b===a)return c;if(b===c)return a;}return null;};
  document.addEventListener('input', e=>{
    const id=e.target.id||'';
    const setPair=(base,vv)=>{const c=document.getElementById(base),h=document.getElementById(base+'_hex');if(c&&c!==e.target)c.value=vv;if(h&&h!==e.target)h.value=vv;};
    const tp=pairFor(id);
    if(tp){ setPair(id.replace(/_hex$/,''),e.target.value); setPair(tp,e.target.value); return; }
    if(id.startsWith('ren_design_')){
      const k=id.slice(11).replace(/_hex$/,'');
      if(!DESIGN_KEYS.includes(k)) return;
      setPair('ren_design_'+k,e.target.value);
      setPair(mainIdFor(k),e.target.value);
    }else{
      const m=/^d_([a-z0-9_]+?)(_hex)?$/.exec(id);
      if(!m) return;
      const k=m[1];
      if(!DESIGN_KEYS.includes(k)) return;
      setPair(mainIdFor(k),e.target.value);
      setPair('ren_design_'+k,e.target.value);
    }
  });
  document.addEventListener('input', e=>{
    const id=e.target.id||'';
    if(id.endsWith('_hex')){
      if(e.target.tagName==='SELECT') return;
      const base=document.getElementById(id.slice(0,-4));
      if(base && /^#[0-9a-fA-F]{6}$/.test(e.target.value)){ try{base.value=e.target.value;}catch{} }
      return;
    }
    if(e.target.type==='color'){
      const hx=document.getElementById(id+'_hex');
      if(hx && hx.tagName!=='SELECT') hx.value=e.target.value;
    }
  });
  document.addEventListener('input', e=>{
    const k=e.target.dataset.k; if(!k || !k.startsWith('ren_')) return;
    const i=Number(e.target.dataset.i);
    if(k==='ren_pin_title') state.renders.pins[i].title=e.target.value;
    else if(k==='ren_pin_slug') state.renders.pins[i].slug=e.target.value;
    else if(k==='ren_pin_number') state.renders.pins[i].number=Number(e.target.value);
    else if(k==='ren_pin_cat') state.renders.pins[i].category=e.target.value;
    else if(k==='ren_pin_accent') state.renders.pins[i].accent=e.target.value;
    else if(k==='ren_pin_x') state.renders.pins[i].x=Number(e.target.value);
    else if(k==='ren_pin_y') state.renders.pins[i].y=Number(e.target.value);
    else if(k==='ren_pin_img') state.renders.pins[i].imageUrl=e.target.value;
    else if(k==='ren_pin_sub') state.renders.pins[i].subtitle=e.target.value;
    else if(k==='ren_pin_artist') state.renders.pins[i].artist=e.target.value;
    else if(k==='ren_pin_body') state.renders.pins[i].body=e.target.value;
    else if(k==='ren_pin_quote') state.renders.pins[i].quote=e.target.value;
    else if(k==='ren_pin_qa') state.renders.pins[i].quoteAuthor=e.target.value;
    else if(k==='ren_pin_video') state.renders.pins[i].videoUrl=e.target.value;
    else if(k==='ren_voice_name') state.renders.voices[i].name=e.target.value;
    else if(k==='ren_voice_place') state.renders.voices[i].place=e.target.value;
    else if(k==='ren_voice_msg') state.renders.voices[i].message=e.target.value;
  });
  // file uploads for renders map/pins
  document.addEventListener('change', async e=>{
    const t=e.target;
    if(!t.dataset.up) return;
    if(t.dataset.up==='ren_map' || t.dataset.up==='ren_mapImage'){
      const f=t.files&&t.files[0]; if(!f) return;
      const opt=await optimizeMapImage(f);
      const d=opt?opt.data:await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f); });
      try{
        const res=await fetch('/__api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:opt?opt.name:f.name, data:d})});
        const j=await res.json(); if(j.ok && j.path) state.renders.settings.mapImage=j.path; else state.renders.settings.mapImage=d;
      }catch{ state.renders.settings.mapImage=d; }
      document.getElementById('ren_mapImage').value=state.renders.settings.mapImage;
      renderRenders();
      try{ localStorage.setItem('portfolio',JSON.stringify(state)); fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}).catch(()=>{}); const ifr=document.getElementById('ren_livePreview'); if(ifr&&ifr.contentWindow) ifr.contentWindow.postMessage({type:'portfolio-update',data:JSON.parse(JSON.stringify(state))},'*'); }catch{}
    }
    if(t.dataset.up==='ren_loader' || t.dataset.up==='ren_loaderImage' || t.dataset.up==='ren_loaderBg'){
      const f=t.files&&t.files[0]; if(!f) return;
      const opt=await optimizeMapImage(f);
      const d=opt?opt.data:await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f); });
      try{
        const res=await fetch('/__api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:opt?opt.name:f.name, data:d})});
        const j=await res.json();
        if(j.ok && j.path){ state.renders.settings.loaderBg=j.path; state.renders.settings.loaderImage=j.path; }
        else { state.renders.settings.loaderBg=d; state.renders.settings.loaderImage=d; }
      }catch{ state.renders.settings.loaderBg=d; state.renders.settings.loaderImage=d; }
      const lb=document.getElementById('ren_loaderBg'); if(lb) lb.value=state.renders.settings.loaderBg;
      renderRenders();
      try{ localStorage.setItem('portfolio',JSON.stringify(state)); fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}).catch(()=>{}); const ifr=document.getElementById('ren_livePreview'); if(ifr&&ifr.contentWindow) ifr.contentWindow.postMessage({type:'portfolio-update',data:JSON.parse(JSON.stringify(state))},'*'); }catch{}
    }
    if(t.dataset.up==='ren_pin_img'){
      const i=Number(t.dataset.i); const f=t.files&&t.files[0]; if(!f) return;
      const d=await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f); });
      try{
        const res=await fetch('/__api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.name, data:d})});
        const j=await res.json(); if(j.ok && j.path) state.renders.pins[i].imageUrl=j.path; else state.renders.pins[i].imageUrl=d;
      }catch{ state.renders.pins[i].imageUrl=d; }
      renderRenders();
    }
  });
  // live sync for header/map text inputs
  const mapInputs=['ren_sectionTitle','ren_mapImage','ren_loaderBg','ren_headerTitle','ren_headerSub','ren_navAbout','ren_navVoices','ren_navCms','ren_soundOn','ren_soundOff','ren_loaderFlyTo','ren_loaderTitle','ren_loaderDesc','ren_loaderLoading','ren_loaderEnter','ren_loaderCoords','ren_loaderLocation','ren_loaderPowered','ren_hint1','ren_hint2','ren_hint3','ren_indexCountSuffix','ren_indexCountSuffix2','ren_indexOpen','ren_indexHide','ren_marquee'];
  mapInputs.forEach(id=>{
    document.getElementById(id)?.addEventListener('input', e=>{
      if(!state.renders) return;
      const s=state.renders.settings;
      if(id==='ren_sectionTitle'){ s.sectionTitle=e.target.value; const disp=document.getElementById('ren_sectionTitleDisplay'); if(disp) disp.textContent=e.target.value||'Renders — Xlerion'; try{ localStorage.setItem('portfolio',JSON.stringify(state)); fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}).catch(()=>{});}catch{} }
      else if(id==='ren_mapImage') s.mapImage=e.target.value;
      else if(id==='ren_headerTitle') s.headerTitle=e.target.value;
      else if(id==='ren_headerSub') s.headerSubtitle=e.target.value;
      else if(id==='ren_navAbout') s.navAbout=e.target.value;
      else if(id==='ren_navVoices') s.navVoices=e.target.value;
      else if(id==='ren_navCms') s.navCms=e.target.value;
      else if(id==='ren_soundOn') s.soundOn=e.target.value;
      else if(id==='ren_soundOff') s.soundOff=e.target.value;
      else if(id==='ren_loaderFlyTo') s.loaderFlyTo=e.target.value;
      else if(id==='ren_loaderTitle') s.loaderTitle=e.target.value;
      else if(id==='ren_loaderDesc') s.loaderDesc=e.target.value;
      else if(id==='ren_loaderLoading') s.loaderLoading=e.target.value;
      else if(id==='ren_loaderEnter') s.loaderEnter=e.target.value;
      else if(id==='ren_loaderCoords') s.loaderCoords=e.target.value;
      else if(id==='ren_loaderLocation') s.loaderLocation=e.target.value;
      else if(id==='ren_loaderPowered') s.loaderPowered=e.target.value;
      else if(id==='ren_loaderBg') s.loaderBg=e.target.value;
      else if(id==='ren_hint1'){ s.hints=s.hints||[]; s.hints[0]=e.target.value; }
      else if(id==='ren_hint2'){ s.hints=s.hints||[]; s.hints[1]=e.target.value; }
      else if(id==='ren_hint3'){ s.hints=s.hints||[]; s.hints[2]=e.target.value; }
      else if(id==='ren_indexCountSuffix') s.indexCountSuffix=e.target.value;
      else if(id==='ren_indexCountSuffix2') s.indexCountSuffix=e.target.value;
      else if(id==='ren_indexOpen') s.indexOpen=e.target.value;
      else if(id==='ren_indexHide') s.indexHide=e.target.value;
      else if(id==='ren_marquee') s.marquee=e.target.value;
    });
  });
  document.addEventListener('click', e=>{
    const b=e.target.closest('[data-del]'); if(!b) return;
    const k=b.dataset.del, i=Number(b.dataset.i);
    if(k==='ren_pin'){ const gone=state.renders.pins[i]; if(gone&&gone.id!==undefined){window.__rendersDeleted=window.__rendersDeleted||[];window.__rendersDeleted.push(gone.id);} state.renders.pins.splice(i,1); renderRenders(); }
    if(k==='ren_voice'){ const gone=state.renders.voices[i]; if(gone&&gone.id!==undefined){window.__rendersDeleted=window.__rendersDeleted||[];window.__rendersDeleted.push(gone.id);} state.renders.voices.splice(i,1); renderRenders(); }
  });
  document.getElementById('ren_addPin')?.addEventListener('click',()=>{
    if(!state.renders) state.renders={pins:[],voices:[],settings:{}};
    if(!state.renders.pins) state.renders.pins=[];
    state.renders.pins.push({id:Date.now(),slug:'nuevo-pin-'+Date.now(),number:state.renders.pins.length+1,title:'Nuevo Pin',subtitle:'',artist:'',category:'mural',year:String(new Date().getFullYear()),accent:'#E4572E',x:50,y:50,imageUrl:'images/p1.jpg',body:'Descripcion',quote:'',quoteAuthor:''});
    renderRenders();
  });
  document.getElementById('ren_addVoice')?.addEventListener('click',()=>{
    if(!state.renders) state.renders={pins:[],voices:[],settings:{}};
    if(!state.renders.voices) state.renders.voices=[];
    state.renders.voices.push({id:Date.now(),name:'Nuevo',place:'',message:'Mensaje'});
    renderRenders();
  });
  // --- SUBIDA DIRECTA IMAGEN MAPA (desde preview) ---
  // optimiza imagen del mapa/loader: reescala a máx 2048px (nunca amplía) + convierte a WebP q85
  async function optimizeMapImage(file, maxDim){
    maxDim=maxDim||2048;
    try{
      if(!window.createImageBitmap || !document.createElement('canvas').getContext) return null;
      const bmp=await createImageBitmap(file);
      const scale=Math.min(1, maxDim/Math.max(bmp.width,bmp.height));
      const cw=Math.max(1,Math.round(bmp.width*scale)), ch=Math.max(1,Math.round(bmp.height*scale));
      const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
      cv.getContext('2d').drawImage(bmp,0,0,cw,ch);
      if(bmp.close) bmp.close();
      const blob=await new Promise(r=>cv.toBlob(r,'image/webp',0.85));
      if(!blob || !blob.size) return null;
      const buf=await blob.arrayBuffer(); const bytes=new Uint8Array(buf); let bin='';
      for(let i=0;i<bytes.length;i+=8192) bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
      const base=String(file.name||'mapa').replace(/\.[a-z0-9]+$/i,'').replace(/[^\w\-]+/g,'-');
      return {data:'data:image/webp;base64,'+btoa(bin), name:base+'.webp', w:cw, h:ch, bytes:blob.size};
    }catch(e){ return null; }
  }
  async function handleMapFile(file){
    if(!file) return;
    if(file.size>8*1024*1024){ alert(file.name+' excede 8MB'); return; }
    const opt=await optimizeMapImage(file);
    const upName=opt?opt.name:file.name;
    const d=opt?opt.data:await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(file); });
    try{
      const res=await fetch('/__api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:upName, data:d})});
      const j=await res.json(); if(j.ok && j.path) state.renders.settings.mapImage=j.path; else state.renders.settings.mapImage=d;
    }catch{ state.renders.settings.mapImage=d; }
    const inp=document.getElementById('ren_mapImage'); if(inp) inp.value=state.renders.settings.mapImage;
    try{ localStorage.setItem('portfolio',JSON.stringify(state)); localStorage.setItem('pa_portfolio',JSON.stringify(state)); }catch{}
    fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}).catch(()=>{});
    renderRenders();
    const ifr=document.getElementById('ren_livePreview'); if(ifr&&ifr.contentWindow) try{ ifr.contentWindow.postMessage({type:'portfolio-update', data: JSON.parse(JSON.stringify(state))},'*'); }catch{}
    const map=document.getElementById('ren_mapPreview'); if(map) map.style.backgroundImage=`url('${state.renders.settings.mapImage}')`;
  }
  document.getElementById('ren_mapFileDirect')?.addEventListener('change', e=>{
    const f=e.target.files&&e.target.files[0]; if(f) handleMapFile(f); e.target.value='';
  });
  const wrap=document.getElementById('ren_mapPreviewWrap');
  if(wrap){
    const hint=document.getElementById('ren_mapDropHint');
    ['dragenter','dragover'].forEach(ev=> wrap.addEventListener(ev, e=>{ e.preventDefault(); if(hint){ hint.style.display='grid'; } wrap.style.outline='2px dashed #E4572E'; }));
    ['dragleave','drop'].forEach(ev=> wrap.addEventListener(ev, e=>{ if(hint) hint.style.display='none'; wrap.style.outline=''; }));
    wrap.addEventListener('drop', e=>{
      e.preventDefault();
      const f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) handleMapFile(f);
    });
  }
  window.renderRenders=renderRenders;
  // ---- MAPA INTERACTIVO + LIVE PREVIEW ----
  let selectedPin=null, isDragging=false;
  function renderMapPreview(){
    const wrap=document.getElementById('ren_mapPreviewWrap');
    const map=document.getElementById('ren_mapPreview');
    if(!wrap||!map) return;
    const s=state.renders?.settings||{};
    map.style.backgroundImage=`url('${s.mapImage||'images/proyectos-parallax.jpg'}')`;
    map.innerHTML='';
    (state.renders?.pins||[]).forEach((p,i)=>{
      const dot=document.createElement('div');
      dot.style.cssText=`position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);cursor:grab;display:flex;flex-direction:column;align-items:center;gap:2px`;
      dot.draggable=false;
      const _styles=state.renders?.settings?.styles||{}; const _op=_styles.pinOpacity??1; const _col=_styles.pinColor||p.accent; const _sh=_styles.pinShape||'circle'; const _br=_sh==='circle'?'50%':_sh==='square'?'0':_sh==='pill'?'999px':'8px'; const _pulseOp=_styles.pinPulseOpacity??0.5; const _pulseScale=_styles.pinPulseScale||1; const _pulseCol=_styles.pinPulseColor||_col; const _feat=(Number(_styles.featPin)||0)===(i+1); const _fring=_styles.featRing||'#E4572E'; dot.innerHTML=`<span style="position:absolute;width:14px;height:14px;border-radius:${_br};background:${_pulseCol};transform:scale(${_pulseScale});opacity:${_pulseOp};border:1px solid ${_pulseCol};display:block"></span><span style="position:relative;width:14px;height:14px;border-radius:${_br};background:${_col};border:2px solid #f4efe6;box-shadow:0 0 8px ${_col}${_feat?`, 0 0 0 3px ${_fring}, 0 0 16px ${_fring}`:''};display:block;opacity:${_op}"></span><span style="font-size:7px;background:rgba(13,12,11,0.8);color:#f4efe6;padding:2px 4px;border-radius:4px;white-space:nowrap">${i+1}</span>`;
      dot.title=p.title;
      let dragging=false, startX, startY;
      dot.addEventListener('mousedown', e=>{
        e.stopPropagation(); dragging=true; isDragging=false; selectedPin=i;
        document.body.style.cursor='grabbing';
        const onMove=(ev)=>{
          if(!dragging) return;
          const rect=map.getBoundingClientRect();
          const x=((ev.clientX-rect.left)/rect.width)*100;
          const y=((ev.clientY-rect.top)/rect.height)*100;
          p.x=Math.min(99,Math.max(1,x)); p.y=Math.min(99,Math.max(1,y));
          dot.style.left=p.x+'%'; dot.style.top=p.y+'%';
          const ix=document.querySelector('[data-k="ren_pin_x"][data-i="'+i+'"]'); if(ix) ix.value=p.x.toFixed(1);
          const iy=document.querySelector('[data-k="ren_pin_y"][data-i="'+i+'"]'); if(iy) iy.value=p.y.toFixed(1);
          isDragging=true;
        };
        const onUp=()=>{
          dragging=false; document.body.style.cursor='';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if(isDragging) renderRenders();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      dot.addEventListener('click', e=>{ e.stopPropagation(); selectedPin=i; document.querySelectorAll('#ren_pins_list .panel').forEach((el,idx)=>{ el.style.outline= idx===i ? '2px solid #E4572E' : ''}); dot.scrollIntoView({behavior:'smooth',block:'nearest'}); });
      map.appendChild(dot);
    });
    // live preview iframe
    let preview=document.getElementById('ren_livePreview');
    if(!preview){
      const panel=map.closest('.panel');
      if(panel){
        const ifr=document.createElement('iframe');
        ifr.id='ren_livePreview';
        ifr.src='renders.html';
        ifr.style.cssText='width:100%;height:420px;border:1px solid var(--border);border-radius:12px;margin-top:12px';
        ifr.title='Vista previa Renders';
        panel.appendChild(ifr);
        const hint=document.createElement('div');
        hint.className='hint';
        hint.textContent='Vista previa en vivo — se actualiza al Guardar';
        hint.style.marginTop='6px';
        panel.appendChild(hint);
      }
    } else {
      // refresh iframe on rerender if needed
    }
  }
  // hook map preview into renderRenders
  const origRenderRenders2 = renderRenders;
  window.renderRenders = function(){ origRenderRenders2(); renderMapPreview(); };
  // click on map to add pin
  document.getElementById('ren_mapPreview')?.addEventListener('click', e=>{
    if(e.target!==e.currentTarget) return;
    const rect=e.currentTarget.getBoundingClientRect();
    const x=((e.clientX-rect.left)/rect.width)*100;
    const y=((e.clientY-rect.top)/rect.height)*100;
    if(!state.renders) state.renders={pins:[],voices:[],settings:{}};
    if(!state.renders.pins) state.renders.pins=[];
    state.renders.pins.push({id:Date.now(),slug:'pin-'+Date.now(),number:state.renders.pins.length+1,title:'Nuevo Pin '+ (state.renders.pins.length+1),subtitle:'',artist:'',category:'mural',year:String(new Date().getFullYear()),accent:'#E4572E',x:Math.round(x*10)/10,y:Math.round(y*10)/10,imageUrl:'images/p1.jpg',body:'',quote:'',quoteAuthor:''});
    renderRenders();
  });
  // reload preview on save
  document.getElementById('saveAllBtn')?.addEventListener('click', ()=>{
    setTimeout(()=>{
      const ifr=document.getElementById('ren_livePreview');
      if(ifr) ifr.src='renders.html?'+Date.now();
      renderMapPreview();
    },400);
  });
  // live reflection on any input in Renders panel (debounced) — mapa + iframe live
  let previewTimer=null;
  document.addEventListener('input', e=>{
    if(!e.target.closest('[data-panel="renders"]')) return;
    clearTimeout(previewTimer);
    previewTimer=setTimeout(()=>{
      const s=state.renders?.settings||{};
      const map=document.getElementById('ren_mapPreview');
      if(map && s.mapImage) map.style.backgroundImage=`url('${s.mapImage}')`;
      renderMapPreview();
      try{ localStorage.setItem('portfolio', JSON.stringify(state)); localStorage.setItem('pa_portfolio', JSON.stringify(state)); localStorage.setItem('pa_v1', JSON.stringify(state)); }catch{}
      // auto-guardado profesional — sin necesidad de botón Guardar
      fetch('/__api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}).catch(()=>{});
      const ifr=document.getElementById('ren_livePreview');
      if(ifr && ifr.contentWindow){
        try{ ifr.contentWindow.postMessage({type:'portfolio-update', data: JSON.parse(JSON.stringify(state))}, '*'); }catch{}
      }
    },600);
  });
  // initial
  setTimeout(renderMapPreview,800);
})();
