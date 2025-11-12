#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.join(__dirname, 'src/app/api/pdf');

function removeBaseUrlReferences(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace ${baseUrl}/api/download/ with /api/download/
    if (content.includes('`${baseUrl}/api/download/')) {
      content = content.replace(/\$\{baseUrl\}\/api\/download\//g, '/api/download/');
      modified = true;
    }

    // Remove baseUrl definitions from error condition blocks
    if (content.includes('Get the base URL for absolute download URLs')) {
      content = content.replace(/(\s*)\/\/ Get the base URL for absolute download URLs[\s\S]*?const baseUrl = `\$\{protocol\}://\$\{host\}`;[\s\S]*?(\s*)return NextResponse\.json\(/g, '$2return NextResponse.json(');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }

    return false;

  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findRouteFiles(dir) {
  const files = [];

  function scanDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item === 'route.ts') {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }

  scanDir(dir);
  return files;
}

function main() {
  console.log('🔧 Removing baseUrl references from API routes...\n');

  if (!fs.existsSync(API_ROUTES_DIR)) {
    console.error('❌ API routes directory not found:', API_ROUTES_DIR);
    process.exit(1);
  }

  const routeFiles = findRouteFiles(API_ROUTES_DIR);
  console.log(`📁 Found ${routeFiles.length} API route files\n`);

  let fixedCount = 0;

  for (const filePath of routeFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`Processing: ${relativePath}`);

    if (removeBaseUrlReferences(filePath)) {
      console.log(`  ✅ Removed baseUrl references`);
      fixedCount++;
    } else {
      console.log(`  ⏭️  No baseUrl references found`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  🔧 Fixed: ${fixedCount} routes`);
  console.log(`  📁 Total: ${routeFiles.length} routes`);

  console.log(`\n🎉 All baseUrl references removed! Frontend will handle URL resolution.`);
}

if (require.main === module) {
  main();
}

module.exports = { removeBaseUrlReferences, findRouteFiles };