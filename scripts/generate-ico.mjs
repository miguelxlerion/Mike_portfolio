import icoEndec from "ico-endec";
const { encode } = icoEndec;
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const publicDir = join(process.cwd(), "public");

// Read PNG files as Uint8Array
const png16 = new Uint8Array(readFileSync(join(publicDir, "favicon-16x16.png")));
const png32 = new Uint8Array(readFileSync(join(publicDir, "favicon-32x32.png")));
const png48 = new Uint8Array(readFileSync(join(publicDir, "favicon-48x48.png")));

// Encode as ICO with multiple sizes
const icoBuffer = encode([
  { width: 16, height: 16, buffer: png16 },
  { width: 32, height: 32, buffer: png32 },
  { width: 48, height: 48, buffer: png48 },
]);

writeFileSync(join(publicDir, "favicon.ico"), Buffer.from(icoBuffer));
console.log("✅ favicon.ico generated (16x16, 32x32, 48x48)");