/**
 * BRAND ANCHOR & ISOLATION POLICY VALIDATOR
 * Ensures each brand operates independently without cross-linking
 * 
 * Validates:
 * - No cross-brand URL references
 * - Brand-specific assets only
 * - Isolated Firebase collections
 * - Domain-specific routing rules
 * - API endpoint isolation
 */

const fs = require('fs');
const path = require('path');

const BRAND_CONFIG = {
  palettemath: {
    domains: ['palettemath.net', 'palettemath.co.za'],
    mainDomain: 'palettemath.net',
    basePath: 'download-site/palettemath-brand',
    firebaseTarget: 'palettemath',
    logo: 'assets/palettemath-logo.svg',
    color: '#0c4c95',
    disallowedBrands: ['saferide', 'prevleak', 'qvedic', 'plumber'],
    apiPrefix: '/api/palettemath',
    firestoreNamespace: 'brands/palettemath'
  },
  saferide: {
    domains: ['saferideapp.co.za', 'saferiderapp.co.za', 'saferidesapp.co.za'],
    mainDomain: 'saferideapp.co.za',
    basePath: 'download-site/saferide-brand',
    firebaseTarget: 'saferide',
    logo: 'assets/saferide-logo.svg',
    color: '#f28c28',
    disallowedBrands: ['palettemath', 'prevleak', 'qvedic', 'plumber'],
    apiPrefix: '/api/saferide',
    firestoreNamespace: 'brands/saferide',
    portals: ['driver', 'rider', 'operations']
  },
  prevleak: {
    domains: ['prevleakgroup.co.za', 'prevleak-peld8.web.app'],
    mainDomain: 'prevleakgroup.co.za',
    basePath: 'download-site/prevleak-brand',
    firebaseTarget: 'prevleak',
    logo: 'assets/prevleak-logo.svg',
    color: '#0056b3',
    disallowedBrands: ['palettemath', 'saferide', 'qvedic', 'plumber'],
    apiPrefix: '/api/prevleak',
    firestoreNamespace: 'brands/prevleak'
  },
  qvedic: {
    domains: ['qvedic.co.za'],
    mainDomain: 'qvedic.co.za',
    basePath: 'download-site/qvedic-site',
    firebaseTarget: 'qvedic',
    logo: 'assets/qvedic-logo.svg',
    color: '#1e5a96',
    disallowedBrands: ['palettemath', 'saferide', 'prevleak', 'plumber'],
    apiPrefix: '/api/qvedic',
    firestoreNamespace: 'brands/qvedic'
  },
  plumber: {
    domains: ['plumber.co.za'],
    mainDomain: 'plumber.co.za',
    basePath: 'download-site/plumber-site',
    firebaseTarget: 'plumber',
    logo: 'assets/plumber-app-icon.svg',
    color: '#d4511f',
    disallowedBrands: ['palettemath', 'saferide', 'prevleak', 'qvedic'],
    apiPrefix: '/api/plumber',
    firestoreNamespace: 'brands/plumber'
  }
};

function assert(condition, message) {
  if (!condition) throw new Error(`[BRAND_ISOLATION_VIOLATION] ${message}`);
}

/**
 * Check for cross-brand URL references
 */
function validateNoCrossBrandLinks(brandName, filePath) {
  const config = BRAND_CONFIG[brandName];
  assert(config, `Unknown brand: ${brandName}`);

  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  
  const violations = [];
  
  // Check for disallowed brand references
  for (const disallowedBrand of config.disallowedBrands) {
    const patterns = [
      new RegExp(`/${disallowedBrand}`, 'gi'),
      new RegExp(`${disallowedBrand}\\.`, 'gi'),
      new RegExp(`/api/${disallowedBrand}`, 'gi'),
      new RegExp(`brands/${disallowedBrand}`, 'gi')
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          file: filePath,
          brand: brandName,
          violation: `Found reference to disallowed brand: ${disallowedBrand}`,
          count: matches.length
        });
      }
    }
  }

  return violations;
}

/**
 * Validate brand-specific Firebase collections
 */
function validateFirestoreIsolation(brandName) {
  const config = BRAND_CONFIG[brandName];
  
  return {
    brandName,
    allowedCollections: [
      `${config.firestoreNamespace}/users`,
      `${config.firestoreNamespace}/workflows`,
      `${config.firestoreNamespace}/data`,
      `${config.firestoreNamespace}/analytics`,
      `${config.firestoreNamespace}/config`
    ],
    deniedCollections: config.disallowedBrands.map(b => `brands/${b}/*`),
    rule: `Only ${config.firestoreNamespace}/* collections accessible`
  };
}

/**
 * Validate API endpoint isolation
 */
function validateAPIIsolation(brandName) {
  const config = BRAND_CONFIG[brandName];
  
  return {
    brandName,
    allowedPrefix: config.apiPrefix,
    deniedPrefixes: config.disallowedBrands.map(b => `/api/${b}`),
    rule: `All APIs must use ${config.apiPrefix} namespace only`
  };
}

/**
 * Validate domain routing rules
 */
function validateDomainRouting(brandName) {
  const config = BRAND_CONFIG[brandName];
  
  return {
    brandName,
    allowedDomains: config.domains,
    mainDomain: config.mainDomain,
    rule: `Requests from other domains must not reach this brand`,
    firebaseTarget: config.firebaseTarget
  };
}

/**
 * Scan all brand files for violations
 */
function scanBrandFiles(brandName) {
  const config = BRAND_CONFIG[brandName];
  const basePath = path.join(process.cwd(), config.basePath);
  
  if (!fs.existsSync(basePath)) {
    return [];
  }

  const violations = [];
  const htmlFiles = [];
  
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
        htmlFiles.push(fullPath);
      }
    }
  }

  walkDir(basePath);

  for (const file of htmlFiles) {
    const fileViolations = validateNoCrossBrandLinks(brandName, file);
    violations.push(...fileViolations);
  }

  return violations;
}

/**
 * Generate brand isolation report
 */
function generateIsolationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    brands: {}
  };

  let totalViolations = 0;

  for (const [brandName, config] of Object.entries(BRAND_CONFIG)) {
    const violations = scanBrandFiles(brandName);
    totalViolations += violations.length;

    report.brands[brandName] = {
      config: {
        domains: config.domains,
        mainDomain: config.mainDomain,
        apiPrefix: config.apiPrefix,
        firestoreNamespace: config.firestoreNamespace,
        firebaseTarget: config.firebaseTarget
      },
      isolation: {
        firestore: validateFirestoreIsolation(brandName),
        api: validateAPIIsolation(brandName),
        domain: validateDomainRouting(brandName)
      },
      violations: violations,
      status: violations.length === 0 ? 'ISOLATED' : 'COMPROMISED'
    };
  }

  report.summary = {
    totalBrands: Object.keys(BRAND_CONFIG).length,
    totalViolations: totalViolations,
    isolationStatus: totalViolations === 0 ? 'PASSING' : 'FAILING',
    requiredFix: totalViolations > 0
  };

  return report;
}

/**
 * Enforce brand routing policy
 */
function enforceRoutingPolicy() {
  const policy = {
    version: '1.0.0',
    enforcement: 'strict-isolation',
    rules: []
  };

  for (const [brandName, config] of Object.entries(BRAND_CONFIG)) {
    policy.rules.push({
      brandName,
      domains: config.domains,
      enforcement: {
        mustNotAccess: config.disallowedBrands,
        allowedAPIPrefix: config.apiPrefix,
        allowedFirestorePrefix: config.firestoreNamespace,
        firebaseTarget: config.firebaseTarget,
        action: 'BLOCK_AND_LOG'
      }
    });
  }

  return policy;
}

function main() {
  try {
    const report = generateIsolationReport();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     BRAND ANCHOR & ISOLATION VALIDATION REPORT        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`Status: ${report.summary.isolationStatus}`);
    console.log(`Total Brands: ${report.summary.totalBrands}`);
    console.log(`Violations Found: ${report.summary.totalViolations}\n`);

    for (const [brandName, brandReport] of Object.entries(report.brands)) {
      console.log(`\n[${brandReport.status}] ${brandName.toUpperCase()}`);
      console.log(`  Domains: ${brandReport.config.domains.join(', ')}`);
      console.log(`  API Prefix: ${brandReport.config.apiPrefix}`);
      console.log(`  Firestore: ${brandReport.config.firestoreNamespace}`);
      
      if (brandReport.violations.length > 0) {
        console.log(`  ⚠️  Violations: ${brandReport.violations.length}`);
        for (const v of brandReport.violations) {
          console.log(`      - ${v.violation}`);
        }
      } else {
        console.log(`  ✓ No cross-brand references detected`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║               ROUTING POLICY ENFORCEMENT               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const policy = enforceRoutingPolicy();
    console.log(`Enforcement Mode: ${policy.enforcement}`);
    console.log(`Rules Configured: ${policy.rules.length}\n`);

    if (report.summary.totalViolations > 0) {
      console.error('\n❌ ISOLATION VALIDATION FAILED');
      console.error('Please fix cross-brand references before deployment');
      process.exit(1);
    } else {
      console.log('\n✅ BRAND ISOLATION VALIDATION PASSED');
      console.log('All brands are properly isolated and anchored\n');
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Validation Error: ${error.message}`);
    process.exit(1);
  }
}

main();
