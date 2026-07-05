const fs = require('fs');
const path = require('path');

const sourceDir = './new_uploads';
const destDir = './uploads';

// Numbering 49 se shuru
let sareeNo = 49;

console.log('Master, renaming shuru ho rahi hai... ✨');

// Folder ke andar ki saari files uthayein
const files = fs
  .readdirSync(sourceDir)
  .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
  .sort();

files.forEach((file) => {
  // Har photo ko saare_49.jpg, saare_50.jpg ke format mein rename karein
  const newName = `saare_${sareeNo}${path.extname(file)}`;

  fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, newName));

  console.log(`✅ ${file} -> ${newName}`);
  sareeNo++; // Agli photo ke liye number badha diya
});

console.log('🎉 Kaam Khatam! Nayi photos 49 se add ho gayi hain.');
