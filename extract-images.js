/**
 * One-time: extract embedded base64 images to images/ folder.
 * Run: node extract-images.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "prime_central_website (9) (1).html");
const IMAGES_DIR = path.join(__dirname, "images");

const raw = fs.readFileSync(SRC, "utf8");

const caps = [
  "Electrical Panel Works",
  "MEP Duct Installation",
  "Chiller Unit Inspection",
  "AC Unit Servicing",
  "Rooftop HVAC Systems",
];

const lbStart = raw.indexOf("const lbData = [");
const lbEnd = raw.indexOf("];", lbStart) + 2;
const lbText = raw.slice(lbStart + "const lbData = ".length, lbEnd);
const lbData = new Function("return " + lbText)();

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

function saveDataUrl(dataUrl, filename) {
  const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) throw new Error("Invalid data URL for " + filename);
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const out = path.join(IMAGES_DIR, filename + "." + ext);
  fs.writeFileSync(out, Buffer.from(m[2], "base64"));
  return "images/" + filename + "." + ext;
}

// Gallery images
lbData.forEach((item, i) => {
  const file = saveDataUrl(item.src, `gallery-${i + 1}`);
  console.log("gallery", i, "->", file, item.cap || caps[i]);
});

// Logo from first nav img
const logoMatch = raw.match(/<nav[\s\S]*?<img src="(data:image\/[^"]+)"/);
if (logoMatch) {
  const file = saveDataUrl(logoMatch[1], "logo");
  console.log("logo ->", file);
}

console.log("Done. Images in", IMAGES_DIR);
