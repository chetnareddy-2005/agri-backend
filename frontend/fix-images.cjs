const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/src="\/assets\//g, 'src="./assets/');
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log('Updated: ' + filePath);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            replaceInFile(fullPath);
        }
    });
}

walkDir(path.join(__dirname, 'src'));
console.log('Done.');
