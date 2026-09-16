import fs from "fs";
import path from "path";

const lettersDir = path.join("public", "letters");
const gifsDir = path.join("public", "gifs");
const outputFile = path.join("public", "glossary.json");

const glossary = [];

const letterFiles = fs.readdirSync(lettersDir);

letterFiles.forEach(file => {
  const word = path.parse(file).name.toUpperCase(); // e.g. A
  const imagePath = `/letters/${file}`;
  const gifPath = `/gifs/${word}.gif`; // assumes gif has same name as jpg

  glossary.push({
    word,
    image: imagePath,
    gif: gifPath,
    examples: [`Example for ${word}`]
  });
});

fs.writeFileSync(outputFile, JSON.stringify(glossary, null, 2));
console.log(`✅ Generated glossary.json with ${glossary.length} flashcards`);
