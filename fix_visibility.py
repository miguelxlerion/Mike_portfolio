import pathlib
p = pathlib.Path('3D Portfolio.html')
t = p.read_text(encoding='utf-8', errors='ignore')
old = """      Object.assign(bgConfig, bgData);
      document.documentElement.style.setProperty('--bg', bgConfig.color);
      document.body.style.background=bgConfig.color;
      document.documentElement.style.setProperty('--laser', bgConfig.particleColor);
      document.documentElement.style.setProperty('--line', bgConfig.lineColor);
      // Rebuild particles if needed (for now just update colors)
      if(particles && bgConfig.particleColor){
        const pc2=bgConfig.particleColor;
        const pr2=parseInt(pc2.slice(1,3),16)/255, pg2=parseInt(pc2.slice(3,5),16)/255, pb2=parseInt(pc2.slice(5,7),16)/255;
        const cols=particles.geometry.attributes.color.array;
        for(let i=0;i<cols.length;i+=3){ cols[i]=pr2; cols[i+1]=pg2; cols[i+2]=pb2; }
        particles.geometry.attributes.color.needsUpdate=true;
        particles.material.color.set(bgConfig.particleColor);
      }"""
new = """      Object.assign(bgConfig, bgData);
      document.documentElement.style.setProperty('--bg', bgConfig.color);
      document.body.style.background=bgConfig.color;
      document.documentElement.style.setProperty('--laser', bgConfig.particleColor);
      document.documentElement.style.setProperty('--line', bgConfig.lineColor);
      // Update visibility for default figures
      try{
        if(typeof particles !== 'undefined' && particles) particles.visible = bgConfig.showParticles!==false;
        if(typeof lines !== 'undefined' && lines) lines.visible = bgConfig.showLines!==false;
        if(typeof torus !== 'undefined' && torus) torus.visible = bgConfig.showTorus!==false;
        if(typeof ico !== 'undefined' && ico) ico.visible = bgConfig.showIco!==false;
      }catch(e){}
      // Rebuild particles if needed (for now just update colors)
      if(particles && bgConfig.particleColor){
        const pc2=bgConfig.particleColor;
        const pr2=parseInt(pc2.slice(1,3),16)/255, pg2=parseInt(pc2.slice(3,5),16)/255, pb2=parseInt(pc2.slice(5,7),16)/255;
        const cols=particles.geometry.attributes.color.array;
        for(let i=0;i<cols.length;i+=3){ cols[i]=pr2; cols[i+1]=pg2; cols[i+2]=pb2; }
        particles.geometry.attributes.color.needsUpdate=true;
      }"""
if old in t:
    t = t.replace(old, new)
    p.write_bytes(t.encode('utf-8'))
    print("fixed visibility")
else:
    print("not found")
    # debug
    import re
    m=re.search(r"Object\.assign\(bgConfig, bgData\).*?particles\.material\.color\.set", t, re.DOTALL)
    if m:
        print(repr(m.group(0)[:500]))
