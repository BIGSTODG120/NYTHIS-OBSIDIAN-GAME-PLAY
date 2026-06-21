const fs = require("fs");
const path = require("path");

const targets = [
  { name: "hub",   classes: ["hub"] },
  { name: "pong",  classes: ["pong"] },
  { name: "snake", classes: ["snake"] },
  { name: "break", classes: ["break"] },
  { name: "sweep", classes: ["sweep"] },
  { name: "drift", classes: ["drift"] },
  { name: "stack", classes: ["stack"] },
  { name: "spire", classes: ["spire"] },
];

let touched = 0, replacements = 0;

for (const t of targets) {
  const dir = path.join("src", "scenes", t.name);
  if (!fs.existsSync(dir)) { console.log("skip (no dir): " + dir); continue; }
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith(".css")) continue;
    const full = path.join(dir, entry);
    const raw = fs.readFileSync(full, "utf8");
    const classGroup = t.classes.join("|");
    const re = new RegExp("(\\.(?:" + classGroup + ")\\s*\\{[^}]*?)background(?:-color)?\\s*:\\s*#[0-9a-fA-F]{3,8}\\s*;", "g");
    const before = raw;
    const patched = raw.replace(re, function(_, prefix) { return prefix + "background: transparent;"; });
    if (patched !== before) {
      const removed = (before.match(re) || []).length;
      fs.writeFileSync(full, patched, "utf8");
      console.log("  patched: " + full.replace(/\\/g, "/") + " (" + removed + " bg op)");
      touched++; replacements += removed;
    } else {
      console.log("  unchanged: " + full.replace(/\\/g, "/"));
    }
  }
}
console.log("");
console.log("CSS files touched: " + touched);
console.log("Background ops:    " + replacements);
