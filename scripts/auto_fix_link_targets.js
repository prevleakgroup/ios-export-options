const fs = require('fs');
const path = require('path');

function walk(dir, allowedExt, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full, allowedExt, out);
      continue;
    }
    if (allowedExt.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function main() {
  const repoRoot = process.cwd();
  const mapPath = path.join(repoRoot, 'company-docs', 'published-domain-map.json');
  const domainMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  const canonicalGoogle = domainMap.appStoreLinks.googlePlay;
  const canonicalApple = domainMap.appStoreLinks.appleAppStore;

  const allowedExt = new Set(['.html', '.md', '.json', '.js', '.txt']);
  const scopeDirs = [
    path.join(repoRoot, 'download-site'),
    path.join(repoRoot, 'company-docs'),
    path.join(repoRoot, 'brand-export'),
    repoRoot,
  ];

  const files = new Set();
  for (const d of scopeDirs) {
    for (const f of walk(d, allowedExt)) files.add(f);
  }

  const googleSearchPattern = /https:\/\/play\.google\.com\/store\/search\?q=[^"\s)<>]+&c=apps/g;
  const appleSearchPattern = /https:\/\/apps\.apple\.com\/[a-z]{2}\/search\?term=[^"\s)<>]+/g;

  const changed = [];
  for (const filePath of files) {
    const before = fs.readFileSync(filePath, 'utf8');
    let after = before;
    after = after.replace(googleSearchPattern, canonicalGoogle);
    after = after.replace(appleSearchPattern, canonicalApple);

    if (after !== before) {
      fs.writeFileSync(filePath, after, 'utf8');
      changed.push(path.relative(repoRoot, filePath));
    }
  }

  console.log(`Auto-fix complete. Updated files: ${changed.length}`);
  for (const rel of changed.sort()) {
    console.log(` - ${rel}`);
  }
}

main();
