import fs from 'fs';
import path from 'path';

<<<<<<< HEAD
const apiDir = path.join(process.cwd(), 'src/app/api');
=======
const apiDir = path.join(process.cwd(), 'pdfpro/src/app/api');
>>>>>>> main

async function addRuntimeConfig(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await addRuntimeConfig(fullPath);
    } else if (entry.name === 'route.ts') {
      let content = await fs.promises.readFile(fullPath, 'utf8');
<<<<<<< HEAD
      if (content.includes('export const runtime')) {
        content = content.replace(/export const runtime = '.*';/, "export const runtime = 'nodejs';");
        await fs.promises.writeFile(fullPath, content);
        console.log(`Updated runtime config in ${fullPath}`);
      } else {
        content = `export const runtime = 'nodejs';\n${content}`;
=======
      if (!content.includes('export const runtime')) {
        content = `export const runtime = 'edge';\n${content}`;
>>>>>>> main
        await fs.promises.writeFile(fullPath, content);
        console.log(`Added runtime config to ${fullPath}`);
      }
    }
  }
}

addRuntimeConfig(apiDir).catch(console.error);
