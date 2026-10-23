import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const publicDir = join(process.cwd(), "public");

async function generateIco() {
  const png16 = readFileSync(join(publicDir, "favicon-16x16.png"));
  const png32 = readFileSync(join(publicDir, "favicon-32x32.png"));
  const png48 = readFileSync(join(publicDir, "favicon-48x48.png"));

  const icoBuffer = await toIco([png16, png32, png48]);
  writeFileSync(join(publicDir, "favicon.ico"), icoBuffer);
  console.log("✅ favicon.ico generated (16x16, 32x32, 48x48)");
}

generateIco().catch(console.error);