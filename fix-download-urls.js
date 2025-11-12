#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.join(__dirname, 'src/app/api/pdf');

// Function to generate absolute URL replacement
const generateUrlCode = () => {
  return `// Get the base URL for absolute download URLs
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = \`\${protocol}://\${host}\`;`;
};

// Function to find and replace downloadUrl in files
function fixDownloadUrls(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the file contains downloadUrl and needs fixing
    if (!content.includes('downloadUrl:') || content.includes('baseUrl')) {
      return false; // Already fixed or no downloadUrl
    }

    // Find the return NextResponse.json statement
    const returnMatch = content.match(/return NextResponse\.json\(\s*\{[\s\S]*?downloadUrl:\s*`\/api\/download\/\$\{[^}]+\}[\s\S]*?\}\s*\);/);

    if (returnMatch) {
      const urlCode = generateUrlCode();

      // Replace the downloadUrl line with absolute URL
      const newContent = content.replace(
        /(return NextResponse\.json\(\s*\{[\s\S]*?)downloadUrl:\s*`\/api\/download\/\$\{([^}]+)\}([\s\S]*?\}\s*\);)/,
        (match, before, urlVar, after) => {
          return before + urlCode + '\n\n    return NextResponse.json({\n      success: true,\n      message: \'File processed successfully\',\n      data: {\n        ' +
          content.match(/data:\s*\{[\s\S]*?filename:[\s\S]*?}/)?.[0]?.replace('data: {', '') +
          ',\n        downloadUrl: `${baseUrl}/api/download/${' + urlVar + '}`' +
          after.replace(/return NextResponse\.json\(\s*\{[\s\S]*?data:\s*\{[\s\S]*?/, '');
        }
      );

      // More specific replacement for the downloadUrl line
      content = content.replace(
        /downloadUrl:\s*`\/api\/download\/\$\{([^}]+)\}`/g,
        'downloadUrl: `${baseUrl}/api/download/${$1}`'
      );

      // Add the URL generation code before the return statement
      const returnIndex = content.indexOf('return NextResponse.json');
      if (returnIndex > -1 && !content.includes('baseUrl')) {
        content = content.substring(0, returnIndex) +
                  urlCode + '\n\n    ' +
                  content.substring(returnIndex);
      }

      fs.writeFileSync(filePath, content);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Recursively find all route.ts files
function findRouteFiles(dir) {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findRouteFiles(fullPath));
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

// Main execution
function main() {
  console.log('🔧 Fixing download URLs in API routes...\n');

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

    if (fixDownloadUrls(filePath)) {
      console.log(`  ✅ Fixed download URLs`);
      fixedCount++;
    } else {
      console.log(`  ⏭️  Skipped (no downloadUrl or already fixed)`);
    }
  }

  console.log(`\n🎉 Complete! Fixed ${fixedCount} out of ${routeFiles.length} API routes`);
  console.log('📝 All download URLs now use absolute paths with proper domain detection');
}

if (require.main === module) {
  main();
}

module.exports = { fixDownloadUrls, findRouteFiles };