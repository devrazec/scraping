import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed to replace __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkImages() {
  const jsonPath = path.join(__dirname, 'data-set-books.json');
  const imagesDir = path.join(__dirname, 'book_images');

  const data = await fs.readFile(jsonPath, 'utf-8');
  const books = JSON.parse(data);

  for (const book of books) {
    const imagePath = path.join(imagesDir, book.filename);

    try {
      await fs.access(imagePath);
      //console.log(`✅ Image exists: ${book.filename}`);
    } catch {
      console.log(`❌ Image missing: ${book.filename}`);
    }
  }
}

checkImages().catch(console.error);
