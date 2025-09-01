const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');

function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const updated = content.replace(
      /from "@\/([^"]+)"/g, 
      (match, importPath) => {
        const relativePath = path.relative(
          path.dirname(filePath), 
          path.join(rootDir, importPath)
        ).replace(/\\/g, '/');
        
        // Ensure the path starts with ./ or ../
        const finalPath = relativePath.startsWith('..') || relativePath.startsWith('.')
          ? relativePath
          : './' + relativePath;
          
        return `from "${finalPath}"`;
      }
    );
    
    if (content !== updated) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Updated imports in ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateImports(fullPath);
    }
  });
}

// Start processing from the src directory
processDirectory(rootDir);
console.log('Import updates complete!');
