const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  assert(fs.existsSync(filePath), `Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadDnsManifests(repoRoot) {
  const dnsRoot = path.join(repoRoot, 'deployments', 'dns');
  assert(fs.existsSync(dnsRoot), 'Missing deployments/dns directory');

  const manifests = [];
  for (const dirEntry of fs.readdirSync(dnsRoot, { withFileTypes: true })) {
    if (!dirEntry.isDirectory()) continue;
    const manifestPath = path.join(dnsRoot, dirEntry.name, 'manifest.json');
    manifests.push(readJson(manifestPath));
  }

  return manifests;
}

function main() {
  const repoRoot = process.cwd();
  const domainMap = readJson(path.join(repoRoot, 'company-docs', 'published-domain-map.json'));
  const routingDns = readJson(path.join(repoRoot, 'company-docs', 'routing-dns-source-of-truth.json'));

  const dnsManifests = loadDnsManifests(repoRoot);
  const appStoreGoogle = readJson(path.join(repoRoot, 'deployments', 'appstores', 'google-play', 'manifest.json'));
  const appStoreApple = readJson(path.join(repoRoot, 'deployments', 'appstores', 'apple-app-store', 'manifest.json'));
  const integration = readJson(path.join(repoRoot, 'deployments', 'integration', 'source-firebase-cloudshell.json'));

  const expectedDomains = new Set(routingDns.forwarding.map((x) => x.domain));
  const foundDomains = new Set(dnsManifests.map((m) => m.domain));

  for (const domain of expectedDomains) {
    assert(foundDomains.has(domain), `Missing DNS manifest for domain: ${domain}`);
  }

  for (const manifest of dnsManifests) {
    assert(manifest.type === 'dns-domain', `Invalid type in ${manifest.id}`);
    assert(typeof manifest.sourcePath === 'string' && manifest.sourcePath.length > 0, `Missing sourcePath in ${manifest.id}`);
    assert(typeof manifest.publishTarget === 'string' && manifest.publishTarget.startsWith('https://'), `Invalid publishTarget in ${manifest.id}`);
    assert(typeof manifest.forwardingExpected === 'string' && manifest.forwardingExpected.startsWith('https://'), `Invalid forwardingExpected in ${manifest.id}`);
    assert(Array.isArray(manifest.dnsPolicy.apexTxtRequired), `Missing apexTxtRequired in ${manifest.id}`);
    assert(typeof manifest.dnsPolicy.dmarcRequired === 'string', `Missing dmarcRequired in ${manifest.id}`);
    assert(manifest.privacyControls && manifest.privacyControls.separateOperationalData === true, `Missing privacy control separateOperationalData in ${manifest.id}`);
  }

  const forwardingByDomain = new Map(routingDns.forwarding.map((x) => [x.domain, x.mustContain]));
  for (const manifest of dnsManifests) {
    const expectedForward = forwardingByDomain.get(manifest.domain);
    if (expectedForward) {
      assert(expectedForward === manifest.forwardingExpected, `Forwarding mismatch for ${manifest.domain}`);
    }
  }

  assert(appStoreGoogle.type === 'appstore', 'Google app-store manifest type must be appstore');
  assert(appStoreApple.type === 'appstore', 'Apple app-store manifest type must be appstore');
  assert(appStoreGoogle.listingUrl === domainMap.appStoreLinks.googlePlay, 'Google app-store URL mismatch');
  assert(appStoreApple.listingUrl === domainMap.appStoreLinks.appleAppStore, 'Apple app-store URL mismatch');

  assert(integration.sourceOfTruth.githubRemote === 'https://github.com/prevleakgroup/PrevLeak-Group.git', 'Integration manifest GitHub remote mismatch');
  assert(integration.firebase.projectId === 'saferide-peld8', 'Integration manifest Firebase project mismatch');
  assert(integration.privacyControls.noCrossTargetPublishing === true, 'Integration privacy control noCrossTargetPublishing must be true');

  console.log('Deployment tree validation passed.');
}

main();
