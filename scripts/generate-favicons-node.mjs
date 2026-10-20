import { createCanvas, loadImage } from "canvas";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// SVG source
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0a0a0b"/>
  <rect x="4" y="4" width="56" height="56" fill="none" stroke="#a3e635" stroke-width="3"/>
  <text x="32" y="42" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#a3e635" text-anchor="middle">MR</text>
</svg>`;

const publicDir = join(process.cwd(), "public");
const svgBuffer = Buffer.from(svgSource);

async function generateFavicons() {
  // Load SVG as image
  const img = await loadImage(svgBuffer);

  // Sizes to generate
  const sizes = [16, 32, 48, 180, 192, 512];

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);

    const filename = size === 180 ? "apple-touch-icon.png" : `favicon-${size}x${size}.png`;
    const pngBuffer = canvas.toBuffer("image/png");
    writeFileSync(join(publicDir, filename), pngBuffer);
    console.log(`✅ ${filename} (${size}x${size})`);
  }

  // Generate favicon.ico with multiple sizes (16, 32, 48)
  // Note: canvas doesn't support ICO directly, so we'll create a simple one
  // For proper ICO, use realfavicongenerator.net with the generated PNGs
  console.log("\n📝 PNGs generated. For favicon.ico, use realfavicongenerator.net with the PNGs.");
  console.log("   Upload favicon-16x16.png, favicon-32x32.png, favicon-48x48.png");
}

generateFavicons().catch(console.error);