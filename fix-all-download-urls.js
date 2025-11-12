#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.join(__dirname, 'src/app/api/pdf');

// Function to add baseUrl definition and fix downloadUrls
function fixApiRoute(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file already has baseUrl logic
    if (content.includes('x-forwarded-proto')) {
      console.log(`  ⏭️  Already has baseUrl logic`);
      return false;
    }

    // Check if file has downloadUrl that needs fixing
    if (!content.includes('downloadUrl:')) {
      console.log(`  ⏭️  No downloadUrl to fix`);
      return false;
    }

    // Find the return statement location
    const returnMatch = content.match(/(\s+)(return NextResponse\.json\(\s*\{)/);
    if (!returnMatch) {
      console.log(`  ⚠️  Could not find return statement`);
      return false;
    }

    const indentation = returnMatch[1];

    // Insert baseUrl logic before return statement
    const baseUrlCode = `${indentation}// Get the base URL for absolute download URLs\n${indentation}const protocol = request.headers.get('x-forwarded-proto') || 'http';\n${indentation}const host = request.headers.get('host') || 'localhost:3000';\n${indentation}const baseUrl = \`\${protocol}://\${host}\`;\n\n${indentation}`;

    // Replace downloadUrl patterns
    content = content.replace(
      /downloadUrl:\s*`\/api\/download\/\$\{([^}]+)\}`/g,
      'downloadUrl: `${baseUrl}/api/download/$1`'
    );

    // Also fix any regular downloadUrl: `/api/download/` patterns
    content = content.replace(
      /downloadUrl:\s*`\/api\/download\/([^`]+)`/g,
      'downloadUrl: `${baseUrl}/api/download/$1`'
    );

    // Insert baseUrl code before return statement
    content = content.replace(
      returnMatch[0],
      baseUrlCode + returnMatch[2]
    );

    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Fixed download URLs`);
    return true;

  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all route.ts files
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

// Main execution
function main() {
  console.log('🔧 Fixing all download URLs in API routes...\n');

  if (!fs.existsSync(API_ROUTES_DIR)) {
    console.error('❌ API routes directory not found:', API_ROUTES_DIR);
    process.exit(1);
  }

  const routeFiles = findRouteFiles(API_ROUTES_DIR);
  console.log(`📁 Found ${routeFiles.length} API route files\n`);

  let fixedCount = 0;
  let alreadyFixedCount = 0;
  let noDownloadUrlCount = 0;

  for (const filePath of routeFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`Processing: ${relativePath}`);

    const result = fixApiRoute(filePath);
    if (result) {
      fixedCount++;
    } else if (fs.readFileSync(filePath, 'utf8').includes('x-forwarded-proto')) {
      alreadyFixedCount++;
    } else if (!fs.readFileSync(filePath, 'utf8').includes('downloadUrl:')) {
      noDownloadUrlCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  🔧 Fixed: ${fixedCount} routes`);
  console.log(`  ✅ Already fixed: ${alreadyFixedCount} routes`);
  console.log(`  ⏭️  No downloadUrl: ${noDownloadUrlCount} routes`);
  console.log(`  📁 Total: ${routeFiles.length} routes`);

  console.log(`\n🎉 All download URLs should now use absolute paths!`);
}

if (require.main === module) {
  main();
}

module.exports = { fixApiRoute, findRouteFiles };