const fs = require('fs');
const path = require('path');

function check(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }
}

function validate() {
  console.log('Validating project...');
  
  // Check essential files
  check('./index.html');
  check('./package.json');
  check('./src/config/constants.js');
  check('./src/core/utils.js');
  check('./src/core/Engine.js');
  check('./src/core/GameScene.js');
  
  // Check systems directory
  const systemsDir = './src/systems';
  if (!fs.existsSync(systemsDir)) {
    throw new Error(`Missing directory: ${systemsDir}`);
  }
  
  const requiredSystems = [
    'InputSystem.js',
    'CarPhysicsSystem.js',
    'ParkingSystem.js',
    'ScoringSystem.js',
    'SeasonSystem.js',
    'GarageSystem.js',
    'DirectorSystem.js',
    'BalanceSystem.js',
    'ContentFactory.js',
    'BossSystem.js',
    'AssetManager.js',
    'ReplaySystem.js',
    'AudioSystem.js'
  ];
  
  for (const sys of requiredSystems) {
    check(path.join(systemsDir, sys));
  }
  
  // Check tools
  check('./tools/build.js');
  check('./tools/validate.js');
  check('./tools/balance-analyzer.js');
  
  // Check tests
  check('./tests/testRunner.js');
  check('./tests/fuzz/seed-fuzzer.js');
  check('./tests/fuzz/simulation-runner.js');
  check('./tests/fuzz/anomaly-detector.js');
  
  console.log('✅ Validation OK');
}

// Run if executed directly
if (require.main === module) {
  try {
    validate();
  } catch (e) {
    console.error('❌ Validation failed:', e.message);
    process.exit(1);
  }
}

module.exports = { validate };
