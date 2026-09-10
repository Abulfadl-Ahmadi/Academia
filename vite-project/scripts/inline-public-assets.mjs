/**
 * Post-step for `npm run build:demo`.
 *
 * Vite copies `public/` next to the bundle and leaves its references as
 * absolute "/name.png" URLs. A single file opened from disk has no server to
 * resolve those, so anything the page actually asks for gets inlined as a
 * data: URI here and the sibling files are dropped.
 *
 *   node scripts/inline-public-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "dist-demo", "index.html");
const publicDir = path.join(root, "public");

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function walk(dir, base = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(abs, rel) : [{ rel, abs }];
  });
}

let html = fs.readFileSync(htmlPath, "utf8");
const before = html.length;
const inlined = [];

// Longest paths first: "/a/b.png" must be replaced before a shorter "/b.png"
// could match inside it.
const files = walk(publicDir).sort((a, b) => b.rel.length - a.rel.length);

for (const { rel, abs } of files) {
  const mime = MIME[path.extname(rel).toLowerCase()];
  if (!mime) continue;
  const needle = `/${rel}`;
  if (!html.includes(needle)) continue;

  const uri = `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
  html = html.split(needle).join(uri);
  inlined.push([rel, Math.round(fs.statSync(abs).size / 1024)]);
}

// The template's head points at things that only exist behind a dev server or
// the real API host; from a file:// demo they are dead requests.
const logo = path.join(root, "src", "assets", "AT.svg");
if (fs.existsSync(logo)) {
  html = html.replace(
    /href="\/src\/assets\/logo\.png"/,
    `href="data:image/svg+xml;base64,${fs.readFileSync(logo).toString("base64")}"`
  );
}
html = html
  .replace(/\s*<link rel="dns-prefetch"[^>]*localhost:8000[^>]*>/g, "")
  .replace(/\s*<link rel="preconnect"[^>]*localhost:8000[^>]*>/g, "")
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, "")
  .replace(/\s*<link rel="manifest"[^>]*>/g, "");

fs.writeFileSync(htmlPath, html, "utf8");

// Everything else Vite copied is dead weight beside a self-contained file.
for (const entry of fs.readdirSync(path.join(root, "dist-demo"))) {
  if (entry === "index.html") continue;
  fs.rmSync(path.join(root, "dist-demo", entry), { recursive: true, force: true });
}

for (const [name, kb] of inlined) console.log(`  inlined ${name} (${kb}KB)`);
console.log(
  `\n${inlined.length} public assets inlined; index.html ${Math.round(before / 1024)}KB -> ${Math.round(
    html.length / 1024
  )}KB`
);
