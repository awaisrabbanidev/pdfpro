#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.join(__dirname, 'src/app/api/pdf');

function fixBaseUrlPlacement(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has proper baseUrl placement
    if (content.includes('baseUrl;') && content.includes('x-forwarded-proto') &&
        !content.includes('baseUrl;') && !content.match(/if\s*\([^)]*baseUrl[^)]*\)/)) {
      console.log(`  ⏭️  Already properly fixed`);
      return false;
    }

    // Check if there's a baseUrl reference without proper definition
    if (!content.includes('baseUrl')) {
      console.log(`  ⏭️  No baseUrl usage found`);
      return false;
    }

    // Look for baseUrl usage in error condition blocks
    const errorConditionPattern = /\s*if\s*\([^)]*\)\s*\{[\s\S]*?baseUrl[\s\S]*?\}/;
    if (errorConditionPattern.test(content)) {
      // Remove baseUrl from error condition
      content = content.replace(
        /(\s*if\s*\([^)]*\)\s*\{[\s\S]*?)\/\/ Get the base URL[\s\S]*?const baseUrl.*?[\s\S]*?(\s*\})/g,
        '$1$2'
      );

      // Add baseUrl before return statement
      const returnMatch = content.match(/(\s*)(return NextResponse\.json\()/);
      if (returnMatch) {
        const baseUrlCode = `\n${returnMatch[1]}// Get the base URL for absolute download URLs\n${returnMatch[1]}const protocol = request.headers.get('x-forwarded-proto') || 'http';\n${returnMatch[1]}const host = request.headers.get('host') || 'localhost:3000';\n${returnMatch[1]}const baseUrl = \`\${protocol}://\${host}\`;\n\n${returnMatch[1]}`;

        content = content.replace(
          returnMatch[0],
          baseUrlCode + returnMatch[2]
        );
      }

      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed baseUrl placement`);
      return true;
    }

    // Check if baseUrl needs to be added before return statement
    if (content.includes('downloadUrl: `${baseUrl}/') && !content.includes('const protocol = request.headers.get')) {
      const returnMatch = content.match(/(\s*)(return NextResponse\.json\()/);
      if (returnMatch) {
        const baseUrlCode = `\n${returnMatch[1]}// Get the base URL for absolute download URLs\n${returnMatch[1]}const protocol = request.headers.get('x-forwarded-proto') || 'http';\n${returnMatch[1]}const host = request.headers.get('host') || 'localhost:3000';\n${returnMatch[1]}const baseUrl = \`\${protocol}://\${host}\`;\n\n${returnMatch[1]}`;

        content = content.replace(
          returnMatch[0],
          baseUrlCode + returnMatch[2]
        );

        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Added missing baseUrl definition`);
        return true;
      }
    }

    console.log(`  ⏭️  No fixes needed or already fixed`);
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
  console.log('🔧 Fixing baseUrl placement in API routes...\n');

  if (!fs.existsSync(API_ROUTES_DIR)) {
    console.error('❌ API routes directory not found:', API_ROUTES_DIR);
    process.exit(1);
  }

  const routeFiles = findRouteFiles(API_ROUTES_DIR);
  console.log(`📁 Found ${routeFiles.length} API route files\n`);

  let fixedCount = 0;
  let alreadyOkCount = 0;
  let noBaseUrlCount = 0;

  for (const filePath of routeFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`Processing: ${relativePath}`);

    const result = fixBaseUrlPlacement(filePath);
    if (result) {
      fixedCount++;
    } else {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('baseUrl')) {
        noBaseUrlCount++;
      } else if (content.includes('const protocol = request.headers.get')) {
        alreadyOkCount++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  🔧 Fixed: ${fixedCount} routes`);
  console.log(`  ✅ Already OK: ${alreadyOkCount} routes`);
  console.log(`  ⏭️  No baseUrl: ${noBaseUrlCount} routes`);
  console.log(`  📁 Total: ${routeFiles.length} routes`);

  console.log(`\n🎉 All baseUrl issues should now be resolved!`);
}

if (require.main === module) {
  main();
}

module.exports = { fixBaseUrlPlacement, findRouteFiles };