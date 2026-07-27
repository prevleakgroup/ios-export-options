const fs = require('fs');
const path = require('path');

function loadCanonicalAppStoreLinks(repoRoot) {
  const mapPath = path.join(repoRoot, 'company-docs', 'published-domain-map.json');
  if (!fs.existsSync(mapPath)) {
    throw new Error(`Missing canonical map file: ${mapPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  if (!parsed.appStoreLinks || !parsed.appStoreLinks.googlePlay || !parsed.appStoreLinks.appleAppStore) {
    throw new Error('Missing appStoreLinks.googlePlay/appleAppStore in published-domain-map.json');
  }

  return {
    googlePlay: parsed.appStoreLinks.googlePlay,
    appleAppStore: parsed.appStoreLinks.appleAppStore,
  };
}

function walkFiles(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, ext, out);
    } else if (full.toLowerCase().endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function isSkippableUrl(url) {
  if (!url) return true;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('data:') ||
    url.startsWith('javascript:') ||
    url.startsWith('#')
  );
}

function normalizeLocalTarget(raw) {
  const noQuery = raw.split('?')[0].split('#')[0];
  if (!noQuery || noQuery === '/') return 'index.html';
  return noQuery;
}

function main() {
  const repoRoot = process.cwd();
  const siteRoot = path.join(repoRoot, 'download-site');
  const htmlFiles = walkFiles(siteRoot, '.html');
  const appStoreLinks = loadCanonicalAppStoreLinks(repoRoot);

  const failures = [];
  const refRegex = /(href|src)="([^"]+)"/g;

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = refRegex.exec(content)) !== null) {
      const refType = match[1];
      const rawUrl = match[2].trim();

      if (rawUrl.startsWith('https://play.google.com/')) {
        if (rawUrl !== appStoreLinks.googlePlay) {
          failures.push(
            `${path.relative(repoRoot, filePath)} has non-canonical ${refType}: ${rawUrl}`
          );
        }
        continue;
      }

      if (rawUrl.startsWith('https://apps.apple.com/')) {
        if (rawUrl.includes('/search?term=')) {
          failures.push(
            `${path.relative(repoRoot, filePath)} uses Apple search URL (not allowed): ${rawUrl}`
          );
          continue;
        }

        if (rawUrl !== appStoreLinks.appleAppStore) {
          failures.push(
            `${path.relative(repoRoot, filePath)} has non-canonical ${refType}: ${rawUrl}`
          );
        }
        continue;
      }

      if (isSkippableUrl(rawUrl)) continue;

      const relativeTarget = normalizeLocalTarget(rawUrl);
      const resolved = path.resolve(path.dirname(filePath), relativeTarget);

      if (!resolved.startsWith(siteRoot)) {
        failures.push(`${path.relative(repoRoot, filePath)} has out-of-scope ${refType}: ${rawUrl}`);
        continue;
      }

      if (!fs.existsSync(resolved)) {
        failures.push(`${path.relative(repoRoot, filePath)} has broken ${refType}: ${rawUrl}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error('Link integrity check failed:');
    for (const failure of failures) {
      console.error(` - ${failure}`);
    }
    process.exit(1);
  }

  console.log('Link integrity checks passed.');
}

main();