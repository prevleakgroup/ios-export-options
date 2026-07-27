const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(filePath) {
  assert(fs.existsSync(filePath), `Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractAppHostingSiteUrl(appHostingRaw) {
  const m = appHostingRaw.match(/name:\s*NEXT_PUBLIC_SITE_URL[\s\S]*?value:\s*(\S+)/m);
  return m ? m[1].trim() : '';
}

function main() {
  const repoRoot = process.cwd();
  const reqPath = path.join(repoRoot, 'deployments', 'integration', 'firebase-setup-requirements.json');
  const firebasercPath = path.join(repoRoot, '.firebaserc');
  const firebaseJsonPath = path.join(repoRoot, 'firebase.json');
  const appHostingPath = path.join(repoRoot, 'apphosting.yaml');
  const functionsPackagePath = path.join(repoRoot, 'functions', 'package.json');
  const dnsUnblockWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'dns-unblock-release.yml');

  const reqs = readJson(reqPath);
  const firebaserc = readJson(firebasercPath);
  const firebaseJson = readJson(firebaseJsonPath);
  const functionsPackage = readJson(functionsPackagePath);
  const appHostingRaw = fs.readFileSync(appHostingPath, 'utf8');
  const dnsUnblockWorkflow = fs.readFileSync(dnsUnblockWorkflowPath, 'utf8');

  assert(firebaserc.projects && firebaserc.projects.default === reqs.firebase.projectId,
    `.firebaserc default project mismatch. Expected ${reqs.firebase.projectId}`);

  assert(firebaseJson.hosting && firebaseJson.hosting.public === reqs.firebase.hostingPublicDir,
    `firebase.json hosting.public mismatch. Expected ${reqs.firebase.hostingPublicDir}`);

  assert(Array.isArray(firebaseJson.functions) && firebaseJson.functions.length > 0,
    'firebase.json functions config is missing');

  const defaultFn = firebaseJson.functions.find((f) => f.codebase === reqs.functions.codebase);
  assert(defaultFn, `firebase.json missing functions codebase ${reqs.functions.codebase}`);
  assert(defaultFn.source === reqs.functions.source,
    `firebase.json functions source mismatch. Expected ${reqs.functions.source}`);

  assert(functionsPackage.engines && functionsPackage.engines.node === reqs.functions.nodeEngine,
    `functions/package.json node engine mismatch. Expected ${reqs.functions.nodeEngine}`);

  const appHostingSiteUrl = extractAppHostingSiteUrl(appHostingRaw);
  assert(appHostingSiteUrl === reqs.firebase.appHostingSiteUrl,
    `apphosting NEXT_PUBLIC_SITE_URL mismatch. Expected ${reqs.firebase.appHostingSiteUrl}`);

  const headerList = ((firebaseJson.hosting || {}).headers || []).flatMap((h) => h.headers || []);
  const headerKeys = new Set(headerList.map((h) => h.key));
  for (const key of reqs.securityHeadersRequired) {
    assert(headerKeys.has(key), `firebase.json missing required security header: ${key}`);
  }

  assert(dnsUnblockWorkflow.includes('FIREBASE_TOKEN'),
    'dns-unblock-release workflow must reference FIREBASE_TOKEN secret');

  console.log('Firebase setup requirements validation passed.');
}

main();
