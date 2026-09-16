// generateISLGifs.js  (run with: node generateISLGifs.js)
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "public");
const lettersDir = path.join(publicDir, "letters");
const gifsDir = path.join(publicDir, "ISL_Gifs");
const outFile1 = path.join(publicDir, "ISL_Gifs.json");
const outFile2 = path.join(publicDir, "glossary.json");

// helper: remove extension, normalize for matching
function normalizeKey(name) {
  return name
    .replace(/\.[^/.]+$/, "")            // remove extension
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")             // underscores/hyphens -> space
    .replace(/[^a-z0-9\s]/g, "")         // remove punctuation
    .replace(/\s+/g, " ");               // collapse spaces
}

// helper: nicer display (title-case-ish)
function prettyDisplay(name) {
  return name
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(s => s.length ? s[0].toUpperCase() + s.slice(1) : "")
    .join(" ");
}

const map = {}; // normalizedKey -> entry

// read letters (A.jpg, B.jpg, etc.)
if (fs.existsSync(lettersDir)) {
  const letters = fs.readdirSync(lettersDir);
  letters.forEach(file => {
    const full = path.join(lettersDir, file);
    if (!fs.statSync(full).isFile()) return;
    const key = normalizeKey(file);
    const baseNoExt = file.replace(/\.[^/.]+$/, "");
    if (!map[key]) {
      map[key] = {
        word: prettyDisplay(baseNoExt),
        image: `/letters/${file.replace(/\\/g, "/")}`,
        gif: null,
        searchKeys: [key]
      };
    } else {
      map[key].image = `/letters/${file.replace(/\\/g, "/")}`;
      if (!map[key].searchKeys.includes(key)) map[key].searchKeys.push(key);
    }
  });
}

// read ISL_Gifs (phrases/words)
if (fs.existsSync(gifsDir)) {
  const gifs = fs.readdirSync(gifsDir);
  gifs.forEach(file => {
    const full = path.join(gifsDir, file);
    if (!fs.statSync(full).isFile()) return;
    const key = normalizeKey(file);
    const baseNoExt = file.replace(/\.[^/.]+$/, "");
    if (!map[key]) {
      map[key] = {
        word: prettyDisplay(baseNoExt),
        image: null,
        gif: `/ISL_Gifs/${file.replace(/\\/g, "/")}`,
        searchKeys: [key]
      };
    } else {
      map[key].gif = `/ISL_Gifs/${file.replace(/\\/g, "/")}`;
      if (!map[key].searchKeys.includes(key)) map[key].searchKeys.push(key);
    }
  });
}

// convert to array
const entries = Object.keys(map).map(k => {
  const e = map[k];
  const extras = [];
  extras.push(e.word.toLowerCase());
  extras.push(k.replace(/\s+/g, "")); // no-space variant
  const searchKeys = Array.from(new Set([...(e.searchKeys||[]), ...extras]));
  return {
    word: e.word,
    image: e.image,
    gif: e.gif,
    searchKeys,
    examples: [`Example for ${e.word}`]
  };
});

// write outputs
fs.writeFileSync(outFile1, JSON.stringify(entries, null, 2), "utf8");
fs.writeFileSync(outFile2, JSON.stringify(entries, null, 2), "utf8");

console.log(`✅ Written ${entries.length} entries to:`);
console.log("  ", outFile1);
console.log("  ", outFile2);
