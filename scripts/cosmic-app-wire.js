const fs = require("fs");
const path = require("path");

const file = path.join("src", "App.tsx");
if (!fs.existsSync(file)) {
  console.error("FAIL: src/App.tsx not found");
  process.exit(1);
}

let raw = fs.readFileSync(file, "utf8");

if (raw.includes("CosmicCanvas")) {
  console.log("SKIP: App.tsx already references CosmicCanvas");
  process.exit(0);
}

// (1) Add import after the last existing import line
const importLines = raw.match(/^import .+$/gm) || [];
if (importLines.length === 0) {
  console.error("FAIL: no existing imports found in App.tsx");
  process.exit(1);
}
const lastImport = importLines[importLines.length - 1];
const lastImportIdx = raw.lastIndexOf(lastImport);
const insertAt = lastImportIdx + lastImport.length;
raw = raw.slice(0, insertAt) + "\nimport CosmicCanvas from './ui/CosmicCanvas'" + raw.slice(insertAt);
console.log("added: import CosmicCanvas from './ui/CosmicCanvas'");

// (2) Wire <CosmicCanvas /> as first child of return statement
// Find: return (
// Then scan for matching closing paren, inject inside.
const returnMatch = raw.match(/\breturn\s*\(/);
if (returnMatch) {
  const startIdx = raw.indexOf(returnMatch[0]);
  const parenStart = startIdx + returnMatch[0].length - 1;
  let depth = 1;
  let i = parenStart + 1;
  while (i < raw.length && depth > 0) {
    if (raw[i] === "(") depth++;
    else if (raw[i] === ")") depth--;
    if (depth === 0) break;
    i++;
  }
  if (depth === 0) {
    const innerStart = parenStart + 1;
    const innerEnd = i;
    const inner = raw.slice(innerStart, innerEnd);
    const trimmed = inner.trim();
    if (trimmed.startsWith("<>")) {
      // Existing fragment — inject CosmicCanvas right after <>
      const fragIdx = inner.indexOf("<>");
      const newInner = inner.slice(0, fragIdx + 2) + "\n      <CosmicCanvas />" + inner.slice(fragIdx + 2);
      raw = raw.slice(0, innerStart) + newInner + raw.slice(innerEnd);
      console.log("wired: injected <CosmicCanvas /> inside existing fragment");
    } else {
      // Wrap in a new fragment
      const wrapped = "\n    <>\n      <CosmicCanvas />\n      " + trimmed + "\n    </>\n  ";
      raw = raw.slice(0, innerStart) + wrapped + raw.slice(innerEnd);
      console.log("wired: wrapped return body in fragment with <CosmicCanvas /> first");
    }
  } else {
    console.error("FAIL: unmatched paren after return — manual patch needed");
    process.exit(1);
  }
} else {
  // Try return without paren (e.g., `return <X />`)
  const direct = raw.match(/\breturn\s+<([\s\S]*?)>/);
  if (direct) {
    console.error("FAIL: return without parens detected — needs manual wrap");
    console.error("Manual patch: change 'return <Foo />' to 'return (<><CosmicCanvas /><Foo /></>)'");
    process.exit(1);
  }
  console.error("FAIL: no return statement located in App.tsx");
  process.exit(1);
}

fs.writeFileSync(file, raw, "utf8");
console.log("");
console.log("App.tsx written successfully");
