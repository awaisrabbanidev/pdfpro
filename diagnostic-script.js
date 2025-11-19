const fs = require('fs').promises;
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

async function runDiagnostics() {
  console.log('Running diagnostics on API routes...');
  const files = await findApiRoutes(apiDir);
  let issuesFound = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const issues = [];

    // Check for fs usage
    if (content.includes('fs/promises')) {
      issues.push('Uses fs/promises which is not available in the edge runtime.');
    }

    // Check for dynamic config
    if (!content.includes('export const dynamic = \'force-dynamic\'')) {
      // This is a layout/page config, but good to check
    }

    // Check for runtime config
    if (!content.includes('export const runtime = \'edge\'')) {
      issues.push('Missing `export const runtime = \'edge\'`.');
    }

    if (issues.length > 0) {
      console.log(`\n[ISSUE] ${file}`);
      issues.forEach(issue => console.log(`  - ${issue}`));
      issuesFound += issues.length;
    }
  }

  if (issuesFound === 0) {
    console.log('\nAll checks passed. No issues found in API routes.');
  } else {
    console.log(`\nFound ${issuesFound} total issues.`);
  }
}

async function findApiRoutes(dir) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await findApiRoutes(fullPath));
    } else if (entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

runDiagnostics().catch(console.error);
