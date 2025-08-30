// Build script for Chrome extension
const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// Copy public files to dist
console.log('Building Chrome extension...');

try {
  // Copy manifest and other public files
  copyFile('public/manifest.json', 'dist/manifest.json');
  copyFile('public/background.js', 'dist/background.js');
  copyFile('public/content.js', 'dist/content.js');
  copyFile('public/content.css', 'dist/content.css');
  
  // Copy icons if they exist
  if (fs.existsSync('public/icons')) {
    copyDir('public/icons', 'dist/icons');
  }
  
  console.log('✅ Chrome extension built successfully!');
  console.log('📁 Extension files are in the dist/ folder');
  console.log('🔧 Load the extension in Chrome by going to chrome://extensions/');
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}