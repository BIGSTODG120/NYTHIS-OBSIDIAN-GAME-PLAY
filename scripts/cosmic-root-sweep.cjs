const fs = require("fs");
const candidates = ["src/styles.css","src/index.css","src/App.css","src/main.css"];
let touched = 0;

for (const f of candidates) {
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, "utf8");
  const re = /((?:^|\})\s*(?:body|html|#root)(?:\s*,\s*(?:body|html|#root))*\s*\{[^}]*?)background(?:-color)?\s*:\s*(?:#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|black|white|[a-z]+)\s*;/g;
  const before = raw;
  const patched = raw.replace(re, function(_, prefix) { return prefix + "background: transparent;"; });
  if (patched !== before) {
    fs.writeFileSync(f, patched, "utf8");
    console.log("  patched: " + f);
    touched++;
  } else {
    console.log("  unchanged: " + f);
  }
}
console.log("");
console.log("Root CSS files touched: " + touched);
