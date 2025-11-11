#!/usr/bin/env node

// Test script for PDF processing API endpoints
const fs = require('fs');
const path = require('path');

// Create a simple test PDF content for testing
const createTestPDF = () => {
  // This is a minimal valid PDF header for testing
  const pdfContent = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj\n' +
    '<<\n' +
    '/Type /Catalog\n' +
    '/Pages 2 0 R\n' +
    '>>\n' +
    'endobj\n' +
    '2 0 obj\n' +
    '<<\n' +
    '/Type /Pages\n' +
    '/Kids [3 0 R]\n' +
    '/Count 1\n' +
    '>>\n' +
    'endobj\n' +
    '3 0 obj\n' +
    '<<\n' +
    '/Type /Page\n' +
    '/Parent 2 0 R\n' +
    '/MediaBox [0 0 612 792]\n' +
    '/Contents 4 0 R\n' +
    '>>\n' +
    'endobj\n' +
    '4 0 obj\n' +
    '<<\n' +
    '/Length 44\n' +
    '>>\n' +
    'stream\n' +
    'BT\n' +
    '/F1 12 Tf\n' +
    '72 720 Td\n' +
    '(Test PDF) Tj\n' +
    'ET\n' +
    'endstream\n' +
    'endobj\n' +
    'xref\n' +
    '0 5\n' +
    '0000000000 65535 f\n' +
    '0000000009 00000 n\n' +
    '0000000054 00000 n\n' +
    '0000000123 00000 n\n' +
    '0000000204 00000 n\n' +
    'trailer\n' +
    '<<\n' +
    '/Size 5\n' +
    '/Root 1 0 R\n' +
    '>>\n' +
    'startxref\n' +
    '313\n' +
    '%%EOF'
  );

  return pdfContent;
};

// Test API endpoints
const testAPIs = async () => {
  const baseUrl = 'http://localhost:3001';
  const testPDF = createTestPDF();
  const base64PDF = testPDF.toString('base64');

  console.log('🚀 Testing PDFPro API Endpoints\n');

  // Test 1: Merge PDF API
  console.log('1. Testing PDF Merge API...');
  try {
    const mergeResponse = await fetch(`${baseUrl}/api/pdf/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [
          {
            name: 'test1.pdf',
            data: base64PDF
          },
          {
            name: 'test2.pdf',
            data: base64PDF
          }
        ],
        outputName: 'merged_test.pdf'
      })
    });

    if (mergeResponse.ok) {
      const result = await mergeResponse.json();
      console.log('   ✅ Merge API working correctly');
      console.log(`   📄 Created file: ${result.data.filename}`);
    } else {
      console.log('   ❌ Merge API failed:', await mergeResponse.text());
    }
  } catch (error) {
    console.log('   ❌ Merge API error:', error.message);
  }

  // Test 2: Split PDF API
  console.log('\n2. Testing PDF Split API...');
  try {
    const splitResponse = await fetch(`${baseUrl}/api/pdf/split`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          name: 'test.pdf',
          data: base64PDF
        },
        splitType: 'single'
      })
    });

    if (splitResponse.ok) {
      const result = await splitResponse.json();
      console.log('   ✅ Split API working correctly');
      console.log(`   📄 Split into ${result.data.filesCreated} files`);
    } else {
      console.log('   ❌ Split API failed:', await splitResponse.text());
    }
  } catch (error) {
    console.log('   ❌ Split API error:', error.message);
  }

  // Test 3: Compress PDF API
  console.log('\n3. Testing PDF Compress API...');
  try {
    const compressResponse = await fetch(`${baseUrl}/api/pdf/compress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          name: 'test.pdf',
          data: base64PDF
        },
        compressionLevel: 'medium'
      })
    });

    if (compressResponse.ok) {
      const result = await compressResponse.json();
      console.log('   ✅ Compress API working correctly');
      console.log(`   📄 Compressed file: ${result.data.filename}`);
    } else {
      console.log('   ❌ Compress API failed:', await compressResponse.text());
    }
  } catch (error) {
    console.log('   ❌ Compress API error:', error.message);
  }

  // Test 4: PDF to Word API
  console.log('\n4. Testing PDF to Word API...');
  try {
    const wordResponse = await fetch(`${baseUrl}/api/pdf/pdf-to-word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          name: 'test.pdf',
          data: base64PDF
        },
        options: {
          preserveFormatting: true,
          includeImages: false,
          ocrEnabled: false
        }
      })
    });

    if (wordResponse.ok) {
      const result = await wordResponse.json();
      console.log('   ✅ PDF to Word API working correctly');
      console.log(`   📄 Converted to: ${result.data.filename}`);
    } else {
      console.log('   ❌ PDF to Word API failed:', await wordResponse.text());
    }
  } catch (error) {
    console.log('   ❌ PDF to Word API error:', error.message);
  }

  console.log('\n🎉 API Testing Complete!');
};

// Run the tests
testAPIs().catch(console.error);