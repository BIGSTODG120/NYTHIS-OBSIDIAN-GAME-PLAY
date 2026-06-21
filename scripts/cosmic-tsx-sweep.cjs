const fs = require("fs");
const path = require("path");

const scenes = ["hub","pong","snake","break","sweep","drift","stack","spire"];
let touched = 0;

for (const name of scenes) {
  const file = path.join("src", "scenes", name, "index.tsx");
  if (!fs.existsSync(file)) { console.log("skip (no file): " + file); continue; }
  const raw = fs.readFileSync(file, "utf8");
  let patched = raw;

  patched = patched.replace(/\s*<color\s+attach=(?:"background"|'background')[^/]*\/>\s*/g, "\n");

  patched = patched.replace(/gl=\{\{([^}]*)\}\}/g, function(match, inner) {
    if (/alpha\s*:/.test(inner)) return match;
    const trimmed = inner.trim();
    const sep = trimmed.length ? ", " : "";
    return "gl={{ alpha: true" + sep + trimmed + " }}";
  });

  patched = patched.replace(/<Canvas(\s[^>]*?)?>/g, function(match, attrs) {
    if (/gl=\{/.test(match)) return match;
    return "<Canvas gl={{ alpha: true }}" + (attrs || "") + ">";
  });

  if (patched !== raw) {
    fs.writeFileSync(file, patched, "utf8");
    console.log("  patched: " + file.replace(/\\/g, "/"));
    touched++;
  } else {
    console.log("  unchanged: " + file.replace(/\\/g, "/"));
  }
}
console.log("");
console.log("Scene index.tsx files touched: " + touched);
