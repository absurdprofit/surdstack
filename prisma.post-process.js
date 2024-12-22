const fs = require('fs');
const path = require('path');
const clientDir = './libs/prisma/.generated';

// Recursively update `.d.ts` files to correct import paths
function updateDtsImports(directory) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      updateDtsImports(filePath);
    } else if (file.endsWith('.d.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      // Replace `.js` imports with `.d.ts`
      content = content.replace(/(from\s+['"].*\/)(.*)\.js(['"])/g, (match, p1, p2, p3) => {
        return `${p1}${p2}.d.ts${p3}`;
      });

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  });
}

updateDtsImports(clientDir);
console.log('Refactor Prisma generated .d.ts files to import declaration instead of implementation files.');
