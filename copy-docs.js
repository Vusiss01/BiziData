import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination directories
const sourceDir = path.join(__dirname, 'src', 'docs');
const destDir1 = path.join(__dirname, 'public', 'src', 'docs');
const destDir2 = path.join(__dirname, 'public', 'docs');

// Create destination directories if they don't exist
if (!fs.existsSync(destDir1)) {
  fs.mkdirSync(destDir1, { recursive: true });
  console.log(`Created directory: ${destDir1}`);
}

if (!fs.existsSync(destDir2)) {
  fs.mkdirSync(destDir2, { recursive: true });
  console.log(`Created directory: ${destDir2}`);
}

// Copy all markdown files
try {
  const files = fs.readdirSync(sourceDir);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      const sourcePath = path.join(sourceDir, file);
      const destPath1 = path.join(destDir1, file);
      const destPath2 = path.join(destDir2, file);

      // Copy to first destination
      fs.copyFileSync(sourcePath, destPath1);

      // Copy to second destination
      fs.copyFileSync(sourcePath, destPath2);

      console.log(`Copied: ${file}`);
    }
  });

  console.log('Documentation files copied successfully!');
} catch (error) {
  console.error('Error copying documentation files:', error);
}
