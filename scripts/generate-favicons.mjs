import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// SVG source (same as current favicon.svg)
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0a0a0b"/>
  <rect x="4" y="4" width="56" height="56" fill="none" stroke="#a3e635" stroke-width="3"/>
  <text x="32" y="42" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#a3e635" text-anchor="middle">MR</text>
</svg>`;

const publicDir = join(process.cwd(), "public");

// Ensure public directory exists
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

// Write the SVG source
writeFileSync(join(publicDir, "favicon.svg"), svgSource);
console.log("✅ favicon.svg written");

// For PNG generation, we'll create a simple HTML that uses canvas to render
// Since we can't use sharp/canvas in this environment easily, let's create
// the ICO and PNG files using a data-driven approach with canvas via a temp HTML

const htmlForPngGen = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Favicon Generator</title>
  <style>
    body { margin: 0; background: #0a0a0b; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="512" height="512"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const svg = \`${svgSource.replace(/`/g, '\\`')}\`;
    const img = new Image();
    img.onload = () => {
      // Draw at max size (512)
      ctx.drawImage(img, 0, 0, 512, 512);
      
      // Generate all sizes
      const sizes = [16, 32, 48, 180, 192, 512];
      sizes.forEach(size => {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx2 = c.getContext('2d');
        ctx2.drawImage(canvas, 0, 0, size, size);
        const link = document.createElement('a');
        link.download = \`favicon-\${size}x\${size}.png\`;
        link.href = c.toDataURL('image/png');
        link.click();
      });
      
      // Also generate ICO (16, 32, 48 combined)
      // For ICO we need special handling - skip for now, just PNGs
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  </script>
</body>
</html>
`;

writeFileSync(join(publicDir, "generate-favicons.html"), htmlForPngGen);
console.log("✅ generate-favicons.html written - open in browser to download PNGs");

// Create site.webmanifest
const manifest = {
  name: "Miguel Rodriguez — Senior Full-Stack Engineer",
  short_name: "Miguel Rodriguez",
  description: "Senior Full-Stack Engineer · Real-Time 3D & AI Data Platforms",
  start_url: "/",
  display: "standalone",
  background_color: "#0a0a0b",
  theme_color: "#0a0a0b",
  icons: [
    {
      src: "/favicon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/favicon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ]
};

writeFileSync(join(publicDir, "site.webmanifest"), JSON.stringify(manifest, null, 2));
console.log("✅ site.webmanifest written");

// Create browserconfig.xml for Windows tiles
const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/favicon-192x192.png"/>
      <TileColor>#0a0a0b</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

writeFileSync(join(publicDir, "browserconfig.xml"), browserconfig);
console.log("✅ browserconfig.xml written");

console.log("\n📋 Next steps:");
console.log("1. Open public/generate-favicons.html in browser");
console.log("2. It will auto-download PNGs for sizes: 16, 32, 48, 180, 192, 512");
console.log("3. Rename downloaded files to match expected names");
console.log("4. For favicon.ico, use online tool (e.g. realfavicongenerator.net) with the PNGs");