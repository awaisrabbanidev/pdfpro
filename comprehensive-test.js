#!/usr/bin/env node

// Comprehensive test for all 19 PDF processing API endpoints
const fs = require('fs');
const path = require('path');

// Create test PDF content
const createTestPDF = (content = 'Test PDF Content') => {
  return Buffer.from(
    `%PDF-1.4\n` +
    `1 0 obj\n` +
    `<<\n` +
    `/Type /Catalog\n` +
    `/Pages 2 0 R\n` +
    `>>\n` +
    `endobj\n` +
    `2 0 obj\n` +
    `<<\n` +
    `/Type /Pages\n` +
    `/Kids [3 0 R]\n` +
    `/Count 1\n` +
    `>>\n` +
    `endobj\n` +
    `3 0 obj\n` +
    `<<\n` +
    `/Type /Page\n` +
    `/Parent 2 0 R\n` +
    `/MediaBox [0 0 612 792]\n` +
    `/Contents 4 0 R\n` +
    `>>\n` +
    `endobj\n` +
    `4 0 obj\n` +
    `<<\n` +
    `/Length 44\n` +
    `>>\n` +
    `stream\n` +
    `BT\n` +
    `/F1 12 Tf\n` +
    `72 720 Td\n` +
    `(${content}) Tj\n` +
    `ET\n` +
    `endstream\n` +
    `endobj\n` +
    `xref\n` +
    `0 5\n` +
    `0000000000 65535 f\n` +
    `0000000009 00000 n\n` +
    `0000000054 00000 n\n` +
    `0000000123 00000 n\n` +
    `0000000204 00000 n\n` +
    `trailer\n` +
    `<<\n` +
    `/Size 5\n` +
    `/Root 1 0 R\n` +
    `>>\n` +
    `startxref\n` +
    `313\n` +
    `%%EOF`
  );
};

// Create test content for different file types
const createTestContent = (type) => {
  switch(type) {
    case 'pptx':
      return Buffer.from('PK\x03\x04', 'binary'); // PPTX header
    case 'xlsx':
      return Buffer.from('PK\x03\x04', 'binary'); // XLSX header
    case 'docx':
      return Buffer.from('PK\x03\x04', 'binary'); // DOCX header
    case 'jpg':
      return Buffer.from('\xFF\xD8\xFF\xE0', 'binary'); // JPEG header
    case 'html':
      return Buffer.from('<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test HTML</h1></body></html>');
    default:
      return createTestPDF();
  }
};

// Test all APIs
const testAllAPIs = async () => {
  const baseUrl = 'http://localhost:3001';
  const results = [];

  console.log('🚀 Comprehensive PDF API Testing\n');

  // Test data
  const testPDF = createTestPDF('Comprehensive Test');
  const base64PDF = testPDF.toString('base64');

  const apis = [
    // Core Operations
    { name: 'Merge PDF', endpoint: '/api/pdf/merge', method: 'POST',
      body: { files: [{ name: 'test1.pdf', data: base64PDF }, { name: 'test2.pdf', data: base64PDF }], outputName: 'merged_test.pdf' } },

    { name: 'Split PDF', endpoint: '/api/pdf/split', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, splitType: 'single' } },

    { name: 'Compress PDF', endpoint: '/api/pdf/compress', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, compressionLevel: 'medium' } },

    { name: 'Rotate PDF', endpoint: '/api/pdf/rotate', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, rotation: { angle: 90, pages: 'all' } } },

    // Document Conversions
    { name: 'PDF to Word', endpoint: '/api/pdf/pdf-to-word', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, options: { preserveFormatting: true, includeImages: false, ocrEnabled: false } } },

    { name: 'PDF to PowerPoint', endpoint: '/api/pdf/pdf-to-powerpoint', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, options: { preserveLayout: true, includeImages: false, slideLayout: 'auto' } } },

    { name: 'PDF to Excel', endpoint: '/api/pdf/pdf-to-excel', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, options: { extractTables: true, includeFormatting: true, sheetLayout: 'auto' } } },

    { name: 'PDF to JPG', endpoint: '/api/pdf/pdf-to-jpg', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, options: { pageRange: 'all', quality: 'medium', format: 'jpg', dpi: 150 } } },

    { name: 'Word to PDF', endpoint: '/api/pdf/word-to-pdf', method: 'POST',
      body: { file: { name: 'test.docx', data: createTestContent('docx').toString('base64') }, options: { preserveFormatting: true, pageSize: 'A4' } } },

    { name: 'PowerPoint to PDF', endpoint: '/api/pdf/powerpoint-to-pdf', method: 'POST',
      body: { file: { name: 'test.pptx', data: createTestContent('pptx').toString('base64') }, options: { preserveAnimations: false, includeNotes: false, pageSize: 'A4', quality: 'medium' } } },

    { name: 'Excel to PDF', endpoint: '/api/pdf/excel-to-pdf', method: 'POST',
      body: { file: { name: 'test.xlsx', data: createTestContent('xlsx').toString('base64') }, options: { preserveFormatting: true, pageSize: 'A4', orientation: 'portrait', includeGridlines: true } } },

    { name: 'JPG to PDF', endpoint: '/api/pdf/jpg-to-pdf', method: 'POST',
      body: { files: [{ name: 'test.jpg', data: createTestContent('jpg').toString('base64') }], options: { pageSize: 'A4', orientation: 'portrait', margins: { top: 20, bottom: 20, left: 20, right: 20 }, imageLayout: 'fit' } } },

    { name: 'HTML to PDF', endpoint: '/api/pdf/html-to-pdf', method: 'POST',
      body: { file: { name: 'test.html', data: createTestContent('html').toString('base64') }, options: { pageSize: 'A4', orientation: 'portrait', margins: { top: 20, bottom: 20, left: 20, right: 20 }, header: true, footer: true } } },

    // Advanced Tools
    { name: 'OCR PDF', endpoint: '/api/pdf/ocr', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, options: { language: 'en', outputFormat: 'pdf', preserveLayout: true } } },

    { name: 'Crop PDF', endpoint: '/api/pdf/crop', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, cropOptions: { pages: 'all', margins: { top: 10, bottom: 10, left: 10, right: 10 }, units: 'mm' } } },

    { name: 'Compare PDF', endpoint: '/api/pdf/compare', method: 'POST',
      body: { files: [{ name: 'test1.pdf', data: base64PDF }, { name: 'test2.pdf', data: base64PDF }], options: { compareMode: 'text', outputFormat: 'html', showDifferences: true } } },

    { name: 'Sign PDF', endpoint: '/api/pdf/sign', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, signature: { text: 'Test Signature', position: { x: 100, y: 100 }, style: 'text' } } },

    { name: 'Protect PDF', endpoint: '/api/pdf/protect', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, protection: { password: 'test123', permissions: { printing: true, copying: false, modifying: false, annotating: false } } } },

    { name: 'Watermark', endpoint: '/api/pdf/watermark', method: 'POST',
      body: { file: { name: 'test.pdf', data: base64PDF }, watermark: { type: 'text', content: 'PDFPro.pro', position: 'diagonal', opacity: 0.3 } } }
  ];

  // Test each API
  for (const api of apis) {
    try {
      console.log(`🧪 Testing ${api.name}...`);

      const response = await fetch(`${baseUrl}${api.endpoint}`, {
        method: api.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(api.body)
      });

      if (response.ok) {
        const result = await response.json();
        results.push({ name: api.name, status: '✅ SUCCESS', response: result });
        console.log(`   ✅ ${api.name}: SUCCESS`);
        console.log(`      📄 Output: ${result.data?.filename || 'Generated file'}`);
      } else {
        const errorText = await response.text();
        results.push({ name: api.name, status: '❌ FAILED', error: errorText });
        console.log(`   ❌ ${api.name}: FAILED (${response.status})`);
        console.log(`      Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({ name: api.name, status: '❌ ERROR', error: error.message });
      console.log(`   ❌ ${api.name}: ERROR - ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  const successCount = results.filter(r => r.status.includes('SUCCESS')).length;
  const failCount = results.length - successCount;

  console.log(`   🟢 Successful: ${successCount}/${results.length}`);
  console.log(`   🔴 Failed: ${failCount}/${results.length}`);
  console.log(`   📈 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  if (failCount > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.status.includes('SUCCESS')).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }

  // Write results to file
  const reportFile = 'test-results.json';
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportFile}`);

  return { successCount, failCount, total: results.length, results };
};

// Run the comprehensive test
testAllAPIs().catch(console.error);