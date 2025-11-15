// Test script to verify API routes implement the exact patterns specified
const fs = require('fs');
const path = require('path');

// Check if files exist and contain the required imports
const uploadRoutePath = './src/app/api/pdf/upload/route.ts';
const pdfToWordRoutePath = './src/app/api/pdf/pdf-to-word/route.ts';
const tempDirsPath = './src/lib/temp-dirs.ts';
const safeJsonParsePath = './src/lib/safe-json-parse.ts';

console.log('🔍 Verifying API implementation matches exact patterns...\n');

// Check temp-dirs.ts
console.log('1. Checking temp-dirs.ts:');
if (fs.existsSync(tempDirsPath)) {
  const content = fs.readFileSync(tempDirsPath, 'utf8');
  const hasEnsureTempDirs = content.includes('export function ensureTempDirs()');
  const hasCorrectDirs = content.includes('export const UPLOADS_DIR = "/tmp/uploads"') &&
                        content.includes('export const OUTPUTS_DIR = "/tmp/outputs"');

  console.log(`   ✓ ensureTempDirs function: ${hasEnsureTempDirs ? 'FOUND' : 'MISSING'}`);
  console.log(`   ✓ Correct directory constants: ${hasCorrectDirs ? 'FOUND' : 'MISSING'}`);
} else {
  console.log('   ❌ temp-dirs.ts not found');
}

// Check safe-json-parse.ts
console.log('\n2. Checking safe-json-parse.ts:');
if (fs.existsSync(safeJsonParsePath)) {
  const content = fs.readFileSync(safeJsonParsePath, 'utf8');
  const hasSafeJsonParse = content.includes('export function safeJsonParse(');
  const hasDetailedLogging = content.includes('safeJsonParse:label] not a string') &&
                            content.includes('safeJsonParse:label] not JSON text');

  console.log(`   ✓ safeJsonParse function: ${hasSafeJsonParse ? 'FOUND' : 'MISSING'}`);
  console.log(`   ✓ Detailed debug logging: ${hasDetailedLogging ? 'FOUND' : 'MISSING'}`);
} else {
  console.log('   ❌ safe-json-parse.ts not found');
}

// Check upload route
console.log('\n3. Checking upload route:');
if (fs.existsSync(uploadRoutePath)) {
  const content = fs.readFileSync(uploadRoutePath, 'utf8');
  const hasEnsureTempDirs = content.includes('ensureTempDirs()');
  const hasFormidable = content.includes('IncomingForm');
  const hasCorrectPattern = content.includes('export const runtime = \'nodejs\'');

  console.log(`   ✓ Calls ensureTempDirs(): ${hasEnsureTempDirs ? 'FOUND' : 'MISSING'}`);
  console.log(`   ✓ Uses formidable: ${hasFormidable ? 'FOUND' : 'MISSING'}`);
  console.log(`   ✓ Next.js App Router pattern: ${hasCorrectPattern ? 'FOUND' : 'MISSING'}`);
} else {
  console.log('   ❌ upload route not found');
}

// Check pdf-to-word route
console.log('\n4. Checking pdf-to-word route:');
if (fs.existsSync(pdfToWordRoutePath)) {
  const content = fs.readFileSync(pdfToWordRoutePath, 'utf8');
  const hasEnsureTempDirs = content.includes('ensureTempDirs()');
  const hasDualMode = content.includes('contentType?.includes(\'application/json\')');
  const hasCorrectImports = content.includes('ensureTempDirs, OUTPUTS_DIR, UPLOADS_DIR');

  console.log(`   ✓ Calls ensureTempDirs(): ${hasEnsureTempDirs ? 'FOUND' : 'MISSING'}`);
  console.log(`   ✓ Dual JSON/FormData mode: ${hasDualMode ? 'FOUND' : 'MISSING'}`);
  console.log(`   ✓ Correct imports: ${hasCorrectImports ? 'FOUND' : 'MISSING'}`);
} else {
  console.log('   ❌ pdf-to-word route not found');
}

console.log('\n🎉 Implementation verification complete!');