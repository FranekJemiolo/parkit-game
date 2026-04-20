const fs = require('fs');
const path = require('path');

function build() {
  console.log('Building ParkIt game...');
  
  // Create dist directory
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Copy assets directory
  const assetsDir = path.join(__dirname, '../assets');
  const distAssetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    copyDirectory(assetsDir, distAssetsDir);
    console.log('Assets copied to dist/assets');
  }
  
  // Read all source files and bundle them
  const srcDir = path.join(__dirname, '../src');
  const bundledJS = bundleSourceFiles(srcDir);
  
  // Read the index.html
  const indexPath = path.join(__dirname, '../index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  
  // Replace only the module script (not the Phaser script tag)
  const moduleScriptRegex = /<script type="module">\s*import { GameScene } from ['"].*\/GameScene\.js['"];[\s\S]*?<\/script>/;
  const bundledScript = `<script>\n${bundledJS}\n</script>`;
  
  html = html.replace(moduleScriptRegex, bundledScript);
  
  // Add build metadata
  const buildMeta = {
    timestamp: Date.now(),
    commit: process.env.GITHUB_SHA || 'local',
    branch: process.env.GITHUB_REF || 'local'
  };
  
  html = html.replace(
    '</body>',
    `<script>window.BUILD_META = ${JSON.stringify(buildMeta)};</script></body>`
  );
  
  // Write the bundled HTML
  const outputPath = path.join(distDir, 'index.html');
  fs.writeFileSync(outputPath, html);
  
  console.log(`Build complete → ${outputPath}`);
  console.log(`Build metadata:`, buildMeta);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function bundleSourceFiles(srcDir) {
  let bundled = '';
  
  // Helper to read and convert module to IIFE
  function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove export statements
    content = content.replace(/^export /gm, '');
    content = content.replace(/^export { /gm, 'const { ');
    content = content.replace(/^} from /gm, '} = ');
    content = content.replace(/^import.*from ['"].*['"];?\s*$/gm, '');
    
    return content;
  }
  
  // Process files in dependency order
  const files = [
    'config/constants.js',
    'core/utils.js',
    'core/Engine.js',
    'systems/InputSystem.js',
    'systems/CarPhysicsSystem.js',
    'systems/ParkingSystem.js',
    'systems/ScoringSystem.js',
    'systems/SeasonSystem.js',
    'systems/GarageSystem.js',
    'systems/DirectorSystem.js',
    'systems/BalanceSystem.js',
    'systems/ContentFactory.js',
    'systems/BossSystem.js',
    'systems/AssetManager.js',
    'systems/ReplaySystem.js',
    'systems/AudioSystem.js',
    'core/GameScene.js'
  ];
  
  for (const file of files) {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
      bundled += `// === ${file} ===\n`;
      bundled += processFile(filePath);
      bundled += '\n\n';
    } else {
      console.warn(`Warning: ${file} not found`);
    }
  }
  
  // Add game initialization code
  bundled += `// === Game Initialization ===\n`;
  bundled += `
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
`;
  
  return bundled;
}

// Run if executed directly
if (require.main === module) {
  build();
}

module.exports = { build };
