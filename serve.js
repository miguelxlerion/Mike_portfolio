const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const port = process.argv[2] || 5173;
const mime = { '.html':'text/html; charset=utf-8', '.json':'application/json; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.mp4':'video/mp4', '.ico':'image/x-icon' };
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/__api/save') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        JSON.parse(body);
        fs.writeFileSync(path.join(root, 'data', 'portfolio.json'), body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"ok":false}');
      }
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/__api/ping') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"ok":true}'); return; }
  if (req.method === 'POST' && req.url === '/__api/upload') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const j = JSON.parse(body);
        const imgDir = path.join(root, 'images');
        fs.mkdirSync(imgDir, { recursive: true });
        let name = String(j.name || 'archivo').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, 40);
        if (!name) name = 'archivo';
        if (!/\.(jpe?g|png|gif|webp|svg|avif|mp4|webm|mov)$/.test(name)) name += '.jpg';
        name = Date.now() + '-' + Math.random().toString(36).slice(2, 6) + path.extname(name);
        const data = j.data || '';
        const b64 = data.indexOf(',') >= 0 ? data.slice(data.indexOf(',') + 1) : data;
        fs.writeFileSync(path.join(imgDir, name), Buffer.from(b64, 'base64'));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: true, path: 'images/' + name }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
      }
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/__api/vite-build') {
    const { spawn } = require('child_process');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    // Run vite build and copy to /vite for GH Pages subfolder
    const viteRoot = path.join(root, 'next-portfolio');
    const child = spawn(process.platform==='win32'?'npm.cmd':'npm', ['run','build'], { cwd: viteRoot, shell: false });
    let out='', err='';
    child.stdout.on('data',d=>out+=d);
    child.stderr.on('data',d=>err+=d);
    child.on('close',code=>{
      if(code!==0){
        res.end(JSON.stringify({ ok:false, error: 'build failed: '+(err||out).slice(0,800) }));
        return;
      }
      try{
        const src = path.join(viteRoot,'dist');
        const dst = path.join(root,'vite');
        // copyRecursive
        const copyRec=(s,d)=>{
          fs.mkdirSync(d,{recursive:true});
          for(const e of fs.readdirSync(s,{withFileTypes:true})){
            const sp=path.join(s,e.name), dp=path.join(d,e.name);
            if(e.isDirectory()) copyRec(sp,dp);
            else fs.copyFileSync(sp,dp);
          }
        };
        // clean old vite
        if(fs.existsSync(dst)) fs.rmSync(dst,{recursive:true,force:true});
        copyRec(src,dst);
        res.end(JSON.stringify({ ok:true }));
      }catch(e){
        res.end(JSON.stringify({ ok:false, error: String(e.message||e).slice(0,800) }));
      }
    });
    return;
  }
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let p = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
  // If directory, serve index.html
  try{ if(fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); }catch{}
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('404 - no encontrado: ' + urlPath); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log('Estudio Prisma corriendo en http://localhost:' + port));