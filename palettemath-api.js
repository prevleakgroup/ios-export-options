/**
 * Palettemath API Integration
 * Dynamic Color Generation & Marketing Integration
 */

class PaletteMathAPI {
  constructor() {
    this.apiEndpoint = 'https://api.palettemath.co.za/generate';
    this.baseColors = ['#1a2b4d', '#2563eb', '#7c3aed', '#ea580c', '#10b981'];
    this.colorHistory = [];
  }

  /**
   * Generate random color scheme using Palettemath algorithm
   */
  async generateColorScheme(seedColor = null) {
    try {
      const seed = seedColor || this.baseColors[Math.floor(Math.random() * this.baseColors.length)];
      
      // Local color generation (fallback if API unavailable)
      const colors = this.generateColorVariations(seed);
      
      // Store in history
      this.colorHistory.push({
        colors: colors,
        timestamp: new Date(),
        seed: seed
      });

      return {
        success: true,
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        light: colors.light,
        dark: colors.dark,
        seed: seed
      };
    } catch (error) {
      console.error('Palettemath API error:', error);
      return this.getFallbackColors();
    }
  }

  /**
   * Generate color variations from seed color
   */
  generateColorVariations(hexColor) {
    const rgb = this.hexToRgb(hexColor);
    
    return {
      primary: hexColor,
      secondary: this.adjustBrightness(hexColor, 20),
      accent: this.adjustBrightness(hexColor, -20),
      light: this.adjustBrightness(hexColor, 40),
      dark: this.adjustBrightness(hexColor, -40)
    };
  }

  /**
   * Convert hex to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Adjust color brightness
   */
  adjustBrightness(hex, percent) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.min(255, Math.max(0, rgb.r + percent));
    const g = Math.min(255, Math.max(0, rgb.g + percent));
    const b = Math.min(255, Math.max(0, rgb.b + percent));

    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Get fallback colors
   */
  getFallbackColors() {
    return {
      success: false,
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      light: '#60a5fa',
      dark: '#1e3a8a'
    };
  }

  /**
   * Apply colors to CSS variables
   */
  applyColorScheme(colorScheme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colorScheme.primary);
    root.style.setProperty('--secondary-color', colorScheme.secondary);
    root.style.setProperty('--accent-color', colorScheme.accent);
    root.style.setProperty('--light-color', colorScheme.light);
    root.style.setProperty('--dark-color', colorScheme.dark);
  }

  /**
   * Random color change every 30 seconds
   */
  startColorCycling(interval = 30000) {
    setInterval(async () => {
      const newScheme = await this.generateColorScheme();
      this.applyColorScheme(newScheme);
    }, interval);
  }

  /**
   * Get color history
   */
  getColorHistory() {
    return this.colorHistory;
  }
}

// Initialize globally
const palettemathAPI = new PaletteMathAPI();
