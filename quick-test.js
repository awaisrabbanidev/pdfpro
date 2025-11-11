#!/usr/bin/env node

// Quick test for key APIs
const testBasicFunctionality = async () => {
  const baseUrl = 'http://localhost:3001';
  const testPDF = Buffer.from('JVBERi0xLjQKJeLjz9M=').toString('base64'); // Simple test PDF

  console.log('🔍 Testing Core Functionality...\n');

  const criticalTests = [
    {
      name: 'Merge PDF',
      endpoint: '/api/pdf/merge',
      body: { files: [{ name: 'test1.pdf', data: testPDF }], outputName: 'merged.pdf' }
    },
    {
      name: 'PDF to Word',
      endpoint: '/api/pdf/pdf-to-word',
      body: { file: { name: 'test.pdf', data: testPDF }, options: { preserveFormatting: true } }
    },
    {
      name: 'Protect PDF',
      endpoint: '/api/pdf/protect',
      body: { file: { name: 'test.pdf', data: testPDF }, protection: { password: 'test123', permissions: { printing: true, copying: false, modifying: false, annotating: false } } }
    }
  ];

  let working = 0;
  let failed = 0;

  for (const test of criticalTests) {
    try {
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${test.name}: WORKING`);
        console.log(`   📄 Output: ${result.data?.filename || 'Generated'}`);
        working++;
      } else {
        console.log(`❌ ${test.name}: FAILED (${response.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${working}/${criticalTests.length} working, ${failed} failed`);
  return { working, failed, total: criticalTests.length };
};

testBasicFunctionality().catch(console.error);