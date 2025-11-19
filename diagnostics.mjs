import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const pdfproRoot = path.join(projectRoot, 'pdfpro');

const checks = [];

async function checkFileContains(filePath, content) {
  try {
    const fullPath = path.join(pdfproRoot, filePath);
    const fileContent = await fs.promises.readFile(fullPath, 'utf8');
    if (fileContent.includes(content)) {
      checks.push({ file: filePath, status: 'PASS', message: `Contains \'${content}\'` });
    } else {
      checks.push({ file: filePath, status: 'FAIL', message: `Does not contain \'${content}\'` });
    }
  } catch (error) {
    checks.push({ file: filePath, status: 'ERROR', message: error.message });
  }
}

async function checkFileNotContains(filePath, content) {
    try {
      const fullPath = path.join(pdfproRoot, filePath);
      const fileContent = await fs.promises.readFile(fullPath, 'utf8');
      if (!fileContent.includes(content)) {
        checks.push({ file: filePath, status: 'PASS', message: `Does not contain \'${content}\'` });
      } else {
        checks.push({ file: filePath, status: 'FAIL', message: `Contains \'${content}\'` });
      }
    } catch (error) {
      checks.push({ file: filePath, status: 'ERROR', message: error.message });
    }
  }

async function checkApiRoutes() {
  const apiDir = path.join(pdfproRoot, 'src/app/api');
  const entries = await fs.promises.readdir(apiDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(apiDir, entry.name);
    if (entry.isDirectory()) {
        const routeFile = path.join(fullPath, 'route.ts');
        if (fs.existsSync(routeFile) && entry.name !== 'download') {
            await checkFileContains(path.relative(pdfproRoot, routeFile), 'export const runtime = \'edge\';');
        }
    }
  }
}

async function runDiagnostics() {
  await checkFileContains('src/app/layout.tsx', "export const dynamic = 'force-dynamic'");
  await checkFileContains('src/app/sitemap.xml/route.ts', "export const dynamic = 'force-dynamic'");
  await checkApiRoutes();
  await checkFileNotContains('src/app/api/download/[filename]/route.ts', "export const runtime = 'edge'");

  console.table(checks);
}

runDiagnostics().catch(console.error);
