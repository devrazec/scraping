import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOKS_JSON = path.join(__dirname, 'data-set-books.json');
const SOURCE_DIR = path.join(__dirname, 'book_images');
const TARGET_DIR = path.join(__dirname, 'valid_images');

async function copyExistingImages() {
  // Ensure target folder exists
  await fs.mkdir(TARGET_DIR, { recursive: true });

  const data = await fs.readFile(BOOKS_JSON, 'utf-8');
  const books = JSON.parse(data);

  for (const book of books) {
    const sourcePath = path.join(SOURCE_DIR, book.filename);
    const targetPath = path.join(TARGET_DIR, book.filename);

    try {
      // Check if source image exists
      await fs.access(sourcePath);

      // Copy image
      await fs.copyFile(sourcePath, targetPath);

      console.log(`✅ Copied: ${book.filename}`);
    } catch {
      console.log(`❌ Missing: ${book.filename}`);
    }
  }
}

copyExistingImages().catch(console.error);

