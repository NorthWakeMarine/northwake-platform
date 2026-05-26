import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public", "brand", "nwmlogofullwhite.png");
const iconsDir = path.join(root, "public", "icons");

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

async function createIcon(size, outputName) {
  const padding = Math.round(size * 0.18);
  const logoSize = size - padding * 2;

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 128, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 128, alpha: 255 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(iconsDir, outputName));

  console.log(`Created ${outputName} (${size}x${size})`);
}

await createIcon(192, "icon-192.png");
await createIcon(512, "icon-512.png");
await createIcon(180, "apple-touch-icon.png");
console.log("PWA icons generated successfully.");
