const fs = require('fs');
const path = require('path');

function assert(name, condition) {
  if (!condition) {
    throw new Error(`FAILED: ${name}`);
  }
  console.log(`PASS: ${name}`);
}

async function runTests() {
  console.log('Running tests...\n');
  
  // Load and run unit tests
  const unitTestsDir = path.join(__dirname, 'unit');
  if (fs.existsSync(unitTestsDir)) {
    const unitFiles = fs.readdirSync(unitTestsDir).filter(f => f.endsWith('.test.js'));
    for (const file of unitFiles) {
      console.log(`\n--- Running ${file} ---`);
      const testModule = require(path.join(unitTestsDir, file));
      testModule(assert);
    }
  }
  
  // Load and run simulation tests
  const simTestsDir = path.join(__dirname, 'simulation');
  if (fs.existsSync(simTestsDir)) {
    const simFiles = fs.readdirSync(simTestsDir).filter(f => f.endsWith('.test.js'));
    for (const file of simFiles) {
      console.log(`\n--- Running ${file} ---`);
      const testModule = require(path.join(simTestsDir, file));
      await testModule(assert);
    }
  }
  
  // Load and run integration tests
  const intTestsDir = path.join(__dirname, 'integration');
  if (fs.existsSync(intTestsDir)) {
    const intFiles = fs.readdirSync(intTestsDir).filter(f => f.endsWith('.test.js'));
    for (const file of intFiles) {
      console.log(`\n--- Running ${file} ---`);
      const testModule = require(path.join(intTestsDir, file));
      testModule(assert);
    }
  }
  
  console.log('\n✅ ALL TESTS PASSED');
}

runTests().catch(err => {
  console.error('\n❌ TESTS FAILED:', err.message);
  process.exit(1);
});
