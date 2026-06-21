const fs = require("fs");
const path = require("path");

function walk(dir, files) {
  files = files || [];
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (e.endsWith(".css")) files.push(full);
  }
  return files;
}

const allCss = walk("src");
let touched = 0, ops = 0;

// Targets: root containers + scene containers
const rootSelectors = ["body", "html", "#root", "\\.hub", "\\.pong", "\\.snake", "\\.break", "\\.sweep", "\\.drift", "\\.stack", "\\.spire", "\\.hub__canvas-wrap", "\\.hub__veil"];

for (const f of allCss) {
  // backup
  fs.writeFileSync(f + ".backup", fs.readFileSync(f, "utf8"), "utf8");

  let src = fs.readFileSync(f, "utf8");
  const before = src;

  for (const sel of rootSelectors) {
    // Match blocks like ".hub { ...background: ANYTHING; ... }" and remove the background line
    const re = new RegExp("(" + sel + "\\s*\\{[^}]*?)background(?:-color|-image)?\\s*:[^;}]*;", "g");
    src = src.replace(re, function(_, prefix) {
      ops++;
      return prefix;
    });
  }

  if (src !== before) {
    fs.writeFileSync(f, src, "utf8");
    console.log("  patched: " + f.replace(/\\/g, "/"));
    touched++;
  }
}

console.log("");
console.log("Files touched: " + touched);
console.log("Background ops removed: " + ops);
