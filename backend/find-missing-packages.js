const fs = require('fs');
const path = require('path');

const SRC_DIR = __dirname;
const IGNORE_DIRS = ['node_modules', '.git'];

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const declaredDeps = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {})
]);

const builtinModules = new Set(require('module').builtinModules);

const foundPackages = new Set();
const requireRegex = /require\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORE_DIRS.includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.name.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            let match;
            while ((match = requireRegex.exec(content)) !== null) {
                let pkgName = match[1];
                if (pkgName.startsWith('@')) {
                    pkgName = pkgName.split('/').slice(0, 2).join('/');
                } else {
                    pkgName = pkgName.split('/')[0];
                }
                foundPackages.add(pkgName);
            }
        }
    }
}

walk(SRC_DIR);

const missing = [...foundPackages].filter(
    pkg => !declaredDeps.has(pkg) && !builtinModules.has(pkg)
);

console.log('\n--- Packages used in code but MISSING from package.json ---');
if (missing.length === 0) {
    console.log('None! All good.');
} else {
    missing.forEach(pkg => console.log(' -', pkg));
    console.log('\nRun this to install them all at once:');
    console.log(`npm install ${missing.join(' ')}`);
}
