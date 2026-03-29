const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // replace `http://localhost:8080 with `${import.meta.env.VITE_API_URL}
            content = content.replace(/`http:\/\/localhost:8080/g, '`${import.meta.env.VITE_API_URL}');
            
            // replace 'http://localhost:8080...' with `${import.meta.env.VITE_API_URL}...`
            content = content.replace(/'http:\/\/localhost:8080([^']*)'/g, '`${import.meta.env.VITE_API_URL}$1`');
            
            // replace "http://localhost:8080..." with `${import.meta.env.VITE_API_URL}...`
            content = content.replace(/"http:\/\/localhost:8080([^"]*)"/g, '`${import.meta.env.VITE_API_URL}$1`');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    });
}

processDir(path.join(__dirname, 'src'));
console.log('Replacement complete.');
