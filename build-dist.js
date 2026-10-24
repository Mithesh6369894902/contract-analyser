const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--> Step 1: Building frontend with Vite...');
execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

console.log('--> Step 2: Syncing output directories for Vercel...');
const frontendDist = path.join(__dirname, 'frontend', 'dist');
const rootDist = path.join(__dirname, 'dist');

if (!fs.existsSync(rootDist)) {
  fs.mkdirSync(rootDist, { recursive: true });
}

fs.cpSync(frontendDist, rootDist, { recursive: true, force: true });

// Universal entrypoint for Vercel backend detector fallback
const entryCode = `const path = require('path');
const fs = require('fs');

let curr = __dirname;
let serverPath = null;
for (let i = 0; i < 5; i++) {
  curr = path.dirname(curr);
  const candidate = path.join(curr, 'server.js');
  if (fs.existsSync(candidate)) {
    serverPath = candidate;
    break;
  }
}

if (serverPath) {
  module.exports = require(serverPath);
} else {
  module.exports = (req, res) => res.status(200).send('SmartReviewAI API Ready');
}
`;

// Provide both server.js, index.js, and package.json in root dist and frontend/dist
const pkgJson = JSON.stringify({ type: 'commonjs' }, null, 2);

[rootDist, frontendDist].forEach(dir => {
  fs.writeFileSync(path.join(dir, 'package.json'), pkgJson);
  fs.writeFileSync(path.join(dir, 'server.js'), entryCode);
  fs.writeFileSync(path.join(dir, 'index.js'), entryCode);
});

console.log('--> Step 3: Build completed successfully!');
console.log('Root dist files:', fs.readdirSync(rootDist));
