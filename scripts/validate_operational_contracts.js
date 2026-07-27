const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkRequiredObjectKeys(obj, keys, label) {
  for (const key of keys) {
    assert(Object.prototype.hasOwnProperty.call(obj, key), `${label} missing key: ${key}`);
  }
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

function normalizedHash(content) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function main() {
  const repoRoot = process.cwd();

  const contractPath = path.join(repoRoot, 'ops', 'contracts', 'operational-data-structure.v1.json');
  const mlPath = path.join(repoRoot, 'ops', 'ml', 'ml-governance.v1.json');
  const domainMapPath = path.join(repoRoot, 'company-docs', 'published-domain-map.json');
  const identityPolicyPath = path.join(repoRoot, 'company-docs', 'identity-verification-source-of-truth.json');
  const routingDnsPath = path.join(repoRoot, 'company-docs', 'routing-dns-source-of-truth.json');
  const regionalNetworkPath = path.join(repoRoot, 'company-docs', 'regional-network-source-of-truth.json');
  const canonicalNetworkPath = path.join(repoRoot, 'deployments', 'integration', 'regions-network.json');
  const referencesPath = path.join(repoRoot, 'download-site', 'references.json');
  const functionsPath = path.join(repoRoot, 'functions', 'index.js');

  const contract = readJson(contractPath);
  const ml = readJson(mlPath);
  const domainMap = readJson(domainMapPath);
  const identityPolicy = readJson(identityPolicyPath);
  const routingDns = readJson(routingDnsPath);
  const regionalNetwork = readJson(regionalNetworkPath);
  const canonicalNetwork = readJson(canonicalNetworkPath);
  const references = readJson(referencesPath);
  const functionsSource = fs.readFileSync(functionsPath, 'utf8');

  checkRequiredObjectKeys(contract, ['version', 'entities', 'crossEntityRules'], 'operational contract');
  for (const entityName of ['incident', 'asset', 'dispatch', 'telemetry']) {
    assert(contract.entities[entityName], `operational contract missing entity: ${entityName}`);
    checkRequiredObjectKeys(contract.entities[entityName], ['required'], `${entityName} entity`);
    assert(Array.isArray(contract.entities[entityName].required) && contract.entities[entityName].required.length > 0, `${entityName}.required must be non-empty`);
  }

  checkRequiredObjectKeys(ml, ['version', 'modelRegistry', 'monitoring', 'controls', 'releaseGates'], 'ml governance');
  checkRequiredObjectKeys(ml.monitoring, ['required', 'thresholds'], 'ml monitoring');
  checkRequiredObjectKeys(ml.monitoring.thresholds, ['latencyP95MsMax', 'errorRateMax', 'dataDriftPsiMax', 'predictionCoverageMin'], 'ml thresholds');

  assert(ml.monitoring.thresholds.errorRateMax <= 0.05, 'errorRateMax is too loose');
  assert(ml.monitoring.thresholds.dataDriftPsiMax <= 0.2, 'dataDriftPsiMax is too loose');

  checkRequiredObjectKeys(domainMap, ['canonicalDomains', 'appStoreLinks', 'policy'], 'published domain map');
  checkRequiredObjectKeys(identityPolicy, ['profilePolicy', 'verificationEmails', 'verificationEndpoints', 'requiredPublicAnchors'], 'identity verification policy');
  checkRequiredObjectKeys(routingDns, ['forwarding', 'dnsPolicy'], 'routing dns policy');
  checkRequiredObjectKeys(routingDns.dnsPolicy, ['domains', 'apexTxtRequired', 'dmarcRequired'], 'routing dns policy dnsPolicy');
  checkRequiredObjectKeys(regionalNetwork, ['api', 'networkPolicy'], 'regional network policy');
  checkRequiredObjectKeys(regionalNetwork.api, ['primaryRegion', 'secondaryRegion', 'endpoints', 'paths'], 'regional network policy api');
  checkRequiredObjectKeys(canonicalNetwork, ['api', 'networkPolicy'], 'canonical network profile');
  checkRequiredObjectKeys(canonicalNetwork.api, ['primaryRegion', 'secondaryRegion', 'endpoints', 'paths'], 'canonical network profile api');
  checkRequiredObjectKeys(references, ['backend'], 'public references');
  checkRequiredObjectKeys(references.backend, ['apiPrimary', 'apiSecondary', 'paths'], 'public references backend');

  assert(Array.isArray(routingDns.forwarding) && routingDns.forwarding.length >= 5, 'routing dns forwarding map is incomplete');
  assert(Array.isArray(routingDns.dnsPolicy.domains) && routingDns.dnsPolicy.domains.length >= 5, 'routing dns domain list is incomplete');
  assert(/^https:\/\//.test(regionalNetwork.api.endpoints.primary), 'regional primary endpoint must be https');
  assert(/^https:\/\//.test(regionalNetwork.api.endpoints.secondary), 'regional secondary endpoint must be https');
  assert(regionalNetwork.api.primaryRegion === canonicalNetwork.api.primaryRegion, 'primary region mismatch between regional and canonical network config');
  assert(regionalNetwork.api.secondaryRegion === canonicalNetwork.api.secondaryRegion, 'secondary region mismatch between regional and canonical network config');
  assert(regionalNetwork.api.endpoints.primary === canonicalNetwork.api.endpoints.primary, 'primary endpoint mismatch between regional and canonical network config');
  assert(regionalNetwork.api.endpoints.secondary === canonicalNetwork.api.endpoints.secondary, 'secondary endpoint mismatch between regional and canonical network config');
  assert(JSON.stringify(regionalNetwork.api.paths) === JSON.stringify(canonicalNetwork.api.paths), 'API paths mismatch between regional and canonical network config');
  assert(references.backend.apiPrimary === canonicalNetwork.api.endpoints.primary, 'references.apiPrimary mismatch with canonical network endpoint');
  assert(references.backend.apiSecondary === canonicalNetwork.api.endpoints.secondary, 'references.apiSecondary mismatch with canonical network endpoint');
  assert(JSON.stringify(references.backend.paths) === JSON.stringify(canonicalNetwork.api.paths), 'references backend paths mismatch with canonical network paths');
  assert(functionsSource.includes('exports.apiUsCentral1'), 'functions source missing apiUsCentral1 export');
  assert(functionsSource.includes('exports.apiEuropeWest1'), 'functions source missing apiEuropeWest1 export');
  assert(functionsSource.includes('/profiles/start-registration'), 'functions source missing start-registration route');
  assert(functionsSource.includes('/profiles/verify-email'), 'functions source missing verify-email route');

  assert(identityPolicy.profilePolicy.required === true, 'identity verification must be required');
  assert(identityPolicy.profilePolicy.method === 'email-verification', 'identity verification method must be email-verification');
  assert(identityPolicy.profilePolicy.strength === 'strong-user-profile', 'identity verification strength must be strong-user-profile');

  const canonicalValues = Object.values(domainMap.canonicalDomains || {});
  for (const value of canonicalValues) {
    assert(/^https:\/\/.+/.test(value), `canonical domain must be https: ${value}`);
    assert(!value.includes('web.app'), `canonical domain must not use web.app: ${value}`);
  }

  const prohibitedPatterns = [
    'file:///',
    'C:/Users/',
    'app-release-signed.aab',
    'saferide-peld8.web.app'
  ];

  const publicHtmlFiles = walkFiles(path.join(repoRoot, 'download-site'), '.html');
  for (const filePath of publicHtmlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const pattern of prohibitedPatterns) {
      assert(!content.includes(pattern), `${path.relative(repoRoot, filePath)} contains prohibited pattern: ${pattern}`);
    }
  }

  const anchorPages = [
    path.join(repoRoot, 'download-site', 'customer-hub.html'),
    path.join(repoRoot, 'download-site', 'rider', 'index.html'),
    path.join(repoRoot, 'download-site', 'driver', 'index.html'),
    path.join(repoRoot, 'download-site', 'apps', 'plumber-app.html'),
    path.join(repoRoot, 'download-site', 'apps', 'public-reporting-app.html')
  ];

  for (const pagePath of anchorPages) {
    const content = fs.readFileSync(pagePath, 'utf8');
    for (const requiredAnchor of identityPolicy.requiredPublicAnchors) {
      assert(content.includes(requiredAnchor), `${path.relative(repoRoot, pagePath)} missing identity anchor: ${requiredAnchor}`);
    }
    assert(content.includes(identityPolicy.verificationEndpoints.customerHub), `${path.relative(repoRoot, pagePath)} missing customer hub verification endpoint`);
  }

  // Prevent accidental "single template" releases where multiple app/site routes publish the same page.
  const isolationPages = [
    'download-site/index.html',
    'download-site/customer-hub.html',
    'download-site/rider/index.html',
    'download-site/driver/index.html',
    'download-site/palettemath.html',
    'download-site/apps/plumber-app.html',
    'download-site/apps/public-reporting-app.html'
  ];

  const seenByHash = new Map();
  for (const relPath of isolationPages) {
    const absPath = path.join(repoRoot, relPath);
    assert(fs.existsSync(absPath), `missing required isolation page: ${relPath}`);
    const content = fs.readFileSync(absPath, 'utf8');
    const hash = normalizedHash(content);

    if (seenByHash.has(hash)) {
      const first = seenByHash.get(hash);
      throw new Error(`duplicate deployed content detected: ${first} and ${relPath}`);
    }

    seenByHash.set(hash, relPath);
  }

  console.log('Operational contracts and ML governance checks passed.');
}

main();
