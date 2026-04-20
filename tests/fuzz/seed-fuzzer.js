const { runSimulation } = require('./simulation-runner');
const { detectAnomalies } = require('./anomaly-detector');
const fs = require('fs');

function fuzzTest(iterations = 500) {
  console.log(`Starting fuzz tests with ${iterations} iterations...`);
  
  const failures = [];
  
  for (let i = 0; i < iterations; i++) {
    const seed = Math.floor(Math.random() * 1e9);
    
    const result = runSimulation(seed);
    const issues = detectAnomalies(result);
    
    if (issues.length > 0) {
      failures.push({
        seed,
        issues
      });
    }
  }
  
  console.log(`Fuzz complete: ${failures.length} failures out of ${iterations} runs`);
  
  // Output results for CI
  const output = {
    totalRuns: iterations,
    failures: failures.length,
    failureRate: failures.length / iterations,
    details: failures
  };
  
  console.log(JSON.stringify(output, null, 2));
  
  return failures;
}

// Run if executed directly
if (require.main === module) {
  const iterations = process.argv[2] ? parseInt(process.argv[2]) : 500;
  fuzzTest(iterations);
}

module.exports = { fuzzTest };
