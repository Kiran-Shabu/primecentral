/**
 * Builds index.html + prime-central.css from the original single-file site.
 * Run: node build-site.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "prime_central_website (9) (1).html");
const OUT_HTML = path.join(__dirname, "index.html");
const OUT_CSS = path.join(__dirname, "prime-central.css");
const IMAGES_DIR = path.join(__dirname, "images");
const LOGO_SRC = "images/prime-logo.png";
const DIRECTOR_SRC = "images/director.png";

const ABOUT_EXTRA_HTML = fs.readFileSync(path.join(__dirname, "partials", "about-blocks.html"), "utf8").replace(
  /images\/director\.png/g,
  DIRECTOR_SRC
);

const CAREERS_EXTRA_HTML = fs.readFileSync(
  path.join(__dirname, "partials", "careers-section.html"),
  "utf8"
);

const GALLERY = [
  { file: "images/gallery-1.jpg", cap: "Electrical Panel Works" },
  { file: "images/gallery-2.jpg", cap: "MEP Duct Installation" },
  { file: "images/gallery-3.jpg", cap: "Chiller Unit Inspection" },
  { file: "images/gallery-4.jpg", cap: "AC Unit Servicing" },
  { file: "images/gallery-5.jpg", cap: "Rooftop HVAC Systems" },
];

const raw = fs.readFileSync(SRC, "utf8");

/* --- Extract & patch CSS --- */
const styleMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error("No <style> block found");
let css = styleMatch[1];

css = css.replace(
  /\.fade-in \{[\s\S]*?\.fade-in\.d4 \{ transition-delay: 0\.4s; \}/,
  `.fade-in {
    opacity: 1;
    transform: none;
    transition: none;
}
.fade-in.visible { opacity: 1; transform: none; }
.fade-in.d1 { transition-delay: 0s; }
.fade-in.d2 { transition-delay: 0s; }
.fade-in.d3 { transition-delay: 0s; }
.fade-in.d4 { transition-delay: 0s; }`
);

css = css.replace(
  `.mobile-nav {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
}
.mobile-nav.open { display: block; }
`,
  `#mobile-drawer.mobile-nav {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    z-index: 2000;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease, visibility 0.25s ease;
}
#mobile-drawer.mobile-nav:target {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
}
`
);

css += `

/* --- No-JS: mobile drawer backdrop --- */
.mobile-nav__scrim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
}
#mobile-drawer .mobile-nav-panel {
    z-index: 1;
}

/* --- No-JS: gallery thumbnails as links --- */
.gal-item__link {
    display: block;
    height: 100%;
    color: inherit;
    position: relative;
}
.gal-item__link img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.gal-item__link .gal-overlay {
    pointer-events: none;
}

/* --- No-JS: gallery lightboxes (:target) --- */
.gallery-lightbox {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.93);
    align-items: center;
    justify-content: center;
    padding: 48px 16px 40px;
    box-sizing: border-box;
}
.gallery-lightbox:target {
    display: flex;
}
.gallery-lightbox__backdrop {
    position: absolute;
    inset: 0;
    cursor: default;
}
.gallery-lightbox__inner {
    position: relative;
    max-width: 90vw;
    max-height: 88vh;
    z-index: 1;
}
.gallery-lightbox__inner img {
    max-width: 100%;
    max-height: 84vh;
    object-fit: contain;
    display: block;
}
.gallery-lightbox__cap {
    position: absolute;
    bottom: -34px;
    left: 0;
    right: 0;
    text-align: center;
    font-family: var(--heading);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.65);
    text-transform: uppercase;
    letter-spacing: 1.5px;
}
.gallery-lightbox__close {
    position: absolute;
    top: -42px;
    right: 0;
    font-size: 30px;
    color: #fff;
    text-decoration: none;
    line-height: 1;
    opacity: 0.85;
    z-index: 2;
}
.gallery-lightbox__close:hover {
    opacity: 1;
}
.gallery-lightbox__prev,
.gallery-lightbox__next {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 30px;
    padding: 14px 18px;
    text-decoration: none;
    line-height: 1;
    z-index: 2;
    transition: background 0.2s;
}
.gallery-lightbox__prev {
    left: 16px;
}
.gallery-lightbox__next {
    right: 16px;
}
.gallery-lightbox__prev:hover,
.gallery-lightbox__next:hover {
    background: var(--red);
}

.skip-target {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

a.hamburger,
a.mobile-close {
    text-decoration: none;
    color: inherit;
}

${fs.readFileSync(path.join(__dirname, "styles", "about-feature.css"), "utf8")}

/* --- Justified body copy --- */
.hero-desc, .section-sub, .about-grid > .fade-in:first-child p,
.director-lead, .director-message-more p, .feature-card p,
.service-offer-card__desc,
.service-desc, .careers-aside__lead, .careers-aside__note, .careers-job__summary, .careers-job__desc,
.careers-job__reqs li, .mv-card p, .footer-brand p {
    text-align: justify; text-justify: inter-word; hyphens: auto; -webkit-hyphens: auto; text-wrap: pretty;
}
.about-quote, .director-sign, .hero-form-sub, .director-showcase__caption,
.careers-openings__title, .careers-openings__sub, .careers-empty__title, .careers-empty__text,
.careers-job__reqs-title, .kpi-label, .stat-label, .process-name, .industry-card__title, .service-name {
    text-align: left;
}
`;

fs.writeFileSync(OUT_CSS, `/* Prime Central — stylesheet split from legacy markup */\n${css}`, "utf8");

/* --- Legacy base64 URLs (for one-time replacement in body) --- */
const lbStart = raw.indexOf("const lbData = [");
const lbEnd = raw.indexOf("];", lbStart) + 2;
const lbText = raw.slice(lbStart + "const lbData = ".length, lbEnd);
const legacyLbData = new Function("return " + lbText)();
const lbData = GALLERY.map((g) => ({ src: g.file, cap: g.cap }));

/* --- Body --- */
let body = raw.slice(raw.indexOf("<body>"), raw.indexOf("<script>"));

body = body.replace(
  /<button class="hamburger" id="hamburger" aria-label="Menu">\s*<span><\/span><span><\/span><span><\/span>\s*<\/button>/,
  '<a href="#mobile-drawer" class="hamburger" id="hamburger" role="button" aria-label="Open menu">\n            <span></span><span></span><span></span>\n        </a>'
);

body = body.replace(
  /<!-- Mobile Navigation -->\s*<div class="mobile-nav" id="mobileNav" onclick="closeMobileIfOutside\(event\)">\s*<div class="mobile-nav-panel">\s*<div class="mobile-nav-header">/,
  `<!-- Mobile Navigation (CSS :target, no JavaScript) -->
<div class="mobile-nav" id="mobile-drawer">
    <a href="#mainNav" class="mobile-nav__scrim" aria-label="Close menu"></a>
    <div class="mobile-nav-panel">
        <div class="mobile-nav-header">`
);

body = body.replace(
  /<button class="mobile-close" onclick="closeMobile\(\)">&#10005;<\/button>/,
  '<a href="#mainNav" class="mobile-close" aria-label="Close menu">&#10005;</a>'
);

body = body.replace(/onclick="closeMobile\(\)"/g, "");

for (let i = 0; i < lbData.length; i++) {
  body = body.replace(
    new RegExp(`<div class="gal-item" onclick="openLightbox\\(${i}\\)">`),
    `<div class="gal-item"><a class="gal-item__link" href="#gallery-lb-${i}">`
  );
}

const capCloses = GALLERY.map((g) => g.cap);
for (const cap of capCloses) {
  body = body.replace(
    `<div class="gal-overlay"><span>${cap}</span></div>\n        </div>`,
    `<div class="gal-overlay"><span>${cap}</span></div>\n            </a>\n        </div>`
  );
}

const lbStartIdx = body.indexOf("<!-- Lightbox -->");
const lbEndIdx = body.indexOf(
  "<!-- ==============================\n     INDUSTRIES",
  lbStartIdx
);
if (lbStartIdx === -1 || lbEndIdx === -1) throw new Error("Lightbox / Industries markers not found");

const lbHtml = lbData
  .map((item, i) => {
    const prev = i === 0 ? lbData.length - 1 : i - 1;
    const next = i === lbData.length - 1 ? 0 : i + 1;
    const cap = item.cap || "";
    return `<!-- Gallery lightbox ${i + 1} -->
<div class="gallery-lightbox" id="gallery-lb-${i}">
    <a class="gallery-lightbox__backdrop" href="#gallery" aria-hidden="true"></a>
    <a class="gallery-lightbox__close" href="#gallery" aria-label="Close">&times;</a>
    <a class="gallery-lightbox__prev" href="#gallery-lb-${prev}" aria-label="Previous image">&#8249;</a>
    <div class="gallery-lightbox__inner">
        <img src="${item.src}" alt="${escapeAttr(cap)}">
        <div class="gallery-lightbox__cap">${escapeHtml(cap)}</div>
    </div>
    <a class="gallery-lightbox__next" href="#gallery-lb-${next}" aria-label="Next image">&#8250;</a>
</div>`;
  })
  .join("\n\n");

body = body.slice(0, lbStartIdx) + lbHtml + "\n\n" + body.slice(lbEndIdx);

const clientsLogoDir = path.join(__dirname, "images", "clients-logo");
const clientLogoFiles = fs.existsSync(clientsLogoDir)
  ? fs
      .readdirSync(clientsLogoDir)
      .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
      .sort()
  : [];
function clientLogoAlt(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
const clientsChips = [];
const doubledLogos = [...clientLogoFiles, ...clientLogoFiles];
doubledLogos.forEach((file, i) => {
  const hidden = i >= clientLogoFiles.length;
  const alt = hidden ? "" : escapeHtml(clientLogoAlt(file));
  const aria = hidden ? ' aria-hidden="true"' : "";
  clientsChips.push(
    `            <div class="client-chip"${aria}><div class="client-logo"><img src="images/clients-logo/${escapeHtml(file)}" alt="${alt}" loading="lazy"></div></div>`
  );
});
const clientsHtml = `        <div class="clients-track" id="clientsTrack">\n${clientsChips.join("\n")}\n        </div>`;
body = body.replace(
  /<div class="clients-track" id="clientsTrack">[\s\S]*?<\/div>/,
  clientsHtml.trim()
);

body = body.replace(/\s*onclick="heroSubmit\(event\)"/, "");
body = body.replace(/\s*onclick="contactSubmit\(event\)"/, "");

body = body.replace(/<a href="(#[^"]+)" >/g, '<a href="$1">');

body = body.replace(
  /<!-- ==============================\s*\n\s*TOP INFO BAR/,
  "<header class=\"site-header\">\n<!-- ==============================\n     TOP INFO BAR"
);
body = body.replace(/<\/nav>\s*\n\s*<!-- Mobile Navigation/, "</nav>\n</header>\n\n<!-- Mobile Navigation");
body = body.replace(
  /<!-- ==============================\s*\n\s*HERO SECTION/,
  "<main class=\"site-main\" id=\"main-content\">\n<!-- ==============================\n     HERO SECTION"
);

if (!body.includes("director-showcase")) {
  body = body.replace(
    /(\s*<\/div>\s*<\/div>\s*<\/div>\s*\n<\/section>\s*\n\s*<!-- ==============================\s*\n\s*SERVICES SECTION)/,
    ABOUT_EXTRA_HTML + "\n    </div>\n</section>\n\n<!-- ==============================\n     SERVICES SECTION"
  );
}

body = body.replace(
  /<li><a href="#certifications">Certifications<\/a><\/li>\s*\n\s*<li><a href="#contact"/g,
  '<li><a href="#certifications">Certifications</a></li>\n            <li><a href="#careers">Careers</a></li>\n            <li><a href="#contact"'
);
body = body.replace(
  /<a href="#certifications">Certifications<\/a>\s*\n\s*<a href="#contact">Contact Us<\/a>/g,
  '<a href="#certifications">Certifications</a>\n        <a href="#careers">Careers</a>\n        <a href="#contact">Contact Us</a>'
);

if (!body.includes('id="careers"')) {
  body = body.replace(
    /<!-- ==============================\s*\n\s*CONTACT SECTION/,
    CAREERS_EXTRA_HTML + "<!-- ==============================\n     CONTACT SECTION"
  );
}

body = body.replace(
  /\n\s*<!-- ==============================\s*\n\s*FOOTER/,
  "\n\n</main>\n\n<!-- ==============================\n     FOOTER"
);

const head = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prime Central Air Conditioning Co. L.L.C | Abu Dhabi, UAE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="prime-central.css">
</head>
`;

body = body.replace("<body>", "<body>\n    <span id=\"page-top\" class=\"skip-target\" aria-hidden=\"true\"></span>");

body = replaceEmbeddedImages(body, raw, legacyLbData);

let out = head + body;
if (!out.includes("careers.js")) {
  out = out.replace("</html>", '<script src="js/careers.js"></script>\n</html>');
}
if (!out.includes("about-sections.js")) {
  out = out.replace(
    '<script src="js/careers.js"></script>',
    '<script src="js/careers.js"></script>\n<script src="js/about-sections.js"></script>'
  );
}
if (!out.includes("services-carousel.js")) {
  out = out.replace(
    '<script src="js/about-sections.js"></script>',
    '<script src="js/about-sections.js"></script>\n<script src="js/services-carousel.js"></script>'
  );
}
out += "\n";
fs.writeFileSync(OUT_HTML, out, "utf8");

console.log("Wrote", OUT_HTML);
console.log("Wrote", OUT_CSS);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/\n/g, " ");
}

/** Swap embedded data: URLs in body for files under images/ */
function replaceEmbeddedImages(html, source, legacyGallery) {
  const logoMatch = source.match(/<nav[\s\S]*?<img src="(data:image\/[^"]+)"/);
  if (logoMatch) {
    html = html.split(logoMatch[1]).join(LOGO_SRC);
  }
  legacyGallery.forEach((item, i) => {
    const file = GALLERY[i]?.file;
    if (file && item.src) html = html.split(item.src).join(file);
  });
  return html;
}
