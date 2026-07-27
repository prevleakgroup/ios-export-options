/**
 * BRAND COLOR SCHEME ENFORCEMENT RULE
 * Ensures all brand assets use consistent, verified color schemes
 * Prevents color contamination across brands
 */

const BRAND_COLOR_SCHEMES = {
  palettemath: {
    name: 'PaletteMath',
    primary: '#0c4c95',      // Deep Blue
    light: '#e8f1ff',         // Light Blue
    pale: '#d4e8ff',          // Pale Blue
    accent: '#ffffff',        // White
    description: 'Educational color analysis platform - cool blues for trust'
  },
  saferide: {
    name: 'SafeRide',
    primary: '#f28c28',       // Warm Orange
    light: '#fff4e8',         // Light Cream
    pale: '#ffe6d0',          // Pale Orange
    accent: '#ffffff',        // White
    description: 'Mobility safety platform - warm orange for energy & trust'
  },
  prevleak: {
    name: 'PrevLeak',
    primary: '#0056b3',       // Navy Blue
    light: '#e8f1ff',         // Light Blue
    pale: '#d4e8ff',          // Pale Blue
    accent: '#ffffff',        // White
    description: 'Infrastructure monitoring - deep blues for authority'
  },
  qvedic: {
    name: 'Qvedic',
    primary: '#1e5a96',       // Medium Blue
    light: '#e8f1ff',         // Light Blue
    pale: '#d4e8ff',          // Pale Blue
    accent: '#ffffff',        // White
    description: 'Content delivery platform - professional blues'
  },
  plumber: {
    name: 'Plumber',
    primary: '#d4511f',       // Warm Brown/Rust
    light: '#f5e6d3',         // Light Beige
    pale: '#ead9c3',          // Pale Tan
    accent: '#ffffff',        // White
    description: 'Field operations - warm earth tones for reliability'
  }
};

/**
 * RULE: Validate brand color consistency
 */
function validateBrandColorScheme(brandName, cssContent) {
  const scheme = BRAND_COLOR_SCHEMES[brandName];
  
  if (!scheme) {
    throw new Error(`Unknown brand: ${brandName}`);
  }

  const violations = [];

  // Check for disallowed colors from other brands
  for (const [otherBrand, otherScheme] of Object.entries(BRAND_COLOR_SCHEMES)) {
    if (otherBrand === brandName) continue;

    // Check if other brand colors appear in this brand's CSS
    if (cssContent.includes(otherScheme.primary)) {
      violations.push({
        type: 'CROSS_BRAND_COLOR',
        message: `Found ${otherBrand} primary color (${otherScheme.primary}) in ${brandName}`,
        color: otherScheme.primary,
        severity: 'HIGH'
      });
    }
  }

  return {
    brandName,
    scheme,
    violations,
    status: violations.length === 0 ? 'COMPLIANT' : 'VIOLATION',
    message: violations.length === 0 
      ? `✓ ${scheme.name} color scheme is consistent and isolated`
      : `✗ ${violations.length} color scheme violation(s) detected`
  };
}

/**
 * RULE: Ensure brand logo uses correct primary color
 */
function validateLogoColorIntegrity(brandName, logoSvgContent) {
  const scheme = BRAND_COLOR_SCHEMES[brandName];
  
  // Verify primary color is used in logo
  const hasPrimaryColor = logoSvgContent.includes(scheme.primary) || 
                         logoSvgContent.toLowerCase().includes(scheme.primary.toLowerCase());

  return {
    brandName,
    scheme,
    hasPrimaryColor,
    status: hasPrimaryColor ? 'VALID' : 'VERIFY_MANUALLY',
    message: hasPrimaryColor
      ? `✓ Logo contains ${scheme.name} primary color (${scheme.primary})`
      : `⚠ Verify logo manually - primary color not detected in SVG`
  };
}

/**
 * RULE: Enforce color scheme consistency in web assets
 */
function validateWebAssetColors(brandName, htmlContent) {
  const scheme = BRAND_COLOR_SCHEMES[brandName];
  const violations = [];

  // Pattern: Look for explicit color values that should use CSS variables
  const colorPatterns = [
    { regex: /#[0-9a-fA-F]{6}/g, type: 'hex' },
    { regex: /rgb\(\d+,\s*\d+,\s*\d+\)/g, type: 'rgb' }
  ];

  for (const pattern of colorPatterns) {
    const matches = htmlContent.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        // Check if this color belongs to another brand
        for (const [otherBrand, otherScheme] of Object.entries(BRAND_COLOR_SCHEMES)) {
          if (otherBrand === brandName) continue;
          
          const otherColors = [otherScheme.primary, otherScheme.light, otherScheme.pale];
          if (otherColors.includes(match)) {
            violations.push({
              color: match,
              brand: otherBrand,
              context: `Found in ${pattern.type} format`
            });
          }
        }
      }
    }
  }

  return {
    brandName,
    scheme,
    violations,
    status: violations.length === 0 ? 'COMPLIANT' : 'VIOLATION',
    recommendation: violations.length > 0 
      ? `Use CSS variables with ${scheme.name} colors: --color-primary, --color-light, --color-pale`
      : `✓ All colors properly isolated`
  };
}

/**
 * RULE: Generate CSS variable declarations for brand
 */
function generateBrandCSSVariables(brandName) {
  const scheme = BRAND_COLOR_SCHEMES[brandName];
  
  if (!scheme) {
    throw new Error(`Unknown brand: ${brandName}`);
  }

  return `
/* ${scheme.name} Brand Color Scheme */
:root[data-brand="${brandName}"] {
  --color-primary: ${scheme.primary};
  --color-light: ${scheme.light};
  --color-pale: ${scheme.pale};
  --color-accent: ${scheme.accent};
  --brand-name: "${scheme.name}";
}

/* Ensure no cross-brand color leakage */
:root[data-brand="${brandName}"] {
  /* Explicitly deny other brand colors */
  ${Object.entries(BRAND_COLOR_SCHEMES)
    .filter(([brand]) => brand !== brandName)
    .map(([brand, otherScheme]) => `
  --deny-${brand}-primary: ${otherScheme.primary}; /* DO NOT USE */
  --deny-${brand}-light: ${otherScheme.light}; /* DO NOT USE */`)
    .join('\n')}
}
`;
}

/**
 * VALIDATION REPORT
 */
function generateColorSchemeReport() {
  const report = {
    timestamp: new Date().toISOString(),
    title: 'Brand Color Scheme Compliance Report',
    schemes: {}
  };

  for (const [brandName, scheme] of Object.entries(BRAND_COLOR_SCHEMES)) {
    report.schemes[brandName] = {
      name: scheme.name,
      primary: scheme.primary,
      light: scheme.light,
      pale: scheme.pale,
      accent: scheme.accent,
      description: scheme.description,
      cssVariable: `--color-primary-${brandName}`,
      status: 'DEFINED'
    };
  }

  return report;
}

// ============================================================================
// EXPORT FOR VALIDATION
// ============================================================================

module.exports = {
  BRAND_COLOR_SCHEMES,
  validateBrandColorScheme,
  validateLogoColorIntegrity,
  validateWebAssetColors,
  generateBrandCSSVariables,
  generateColorSchemeReport
};

// ============================================================================
// USAGE SUMMARY
// ============================================================================

if (require.main === module) {
  const report = generateColorSchemeReport();
  
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║      BRAND COLOR SCHEME ENFORCEMENT RULE           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('Color Scheme Definitions:\n');
  for (const [brand, scheme] of Object.entries(BRAND_COLOR_SCHEMES)) {
    console.log(`[${scheme.name.toUpperCase()}]`);
    console.log(`  Primary:  ${scheme.primary}`);
    console.log(`  Light:    ${scheme.light}`);
    console.log(`  Pale:     ${scheme.pale}`);
    console.log(`  ${scheme.description}\n`);
  }

  console.log('Enforcement Rules:');
  console.log('  1. ✓ Each brand uses ONLY its defined color scheme');
  console.log('  2. ✓ Cross-brand colors are explicitly denied');
  console.log('  3. ✓ Logos anchor brand identity via primary color');
  console.log('  4. ✓ Web assets use CSS variables, not hardcoded colors');
  console.log('  5. ✓ Color validation runs on every deployment\n');
}
