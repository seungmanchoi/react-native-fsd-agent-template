// Semantic tokens mirror src/shared/config/theme.ts (StyleSheet side) — keep both in sync.
// Brand color = `primary` (bg-primary, text-primary); foreground text = `text-*`
// (text-text-primary, text-text-secondary) so body copy never turns brand blue.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          500: '#ec4899',
        },
        background: {
          DEFAULT: '#0a0a0a',
          secondary: '#141414',
          tertiary: '#1a1a1a',
        },
        surface: {
          DEFAULT: 'rgba(26, 26, 26, 0.8)',
          hover: 'rgba(38, 38, 38, 0.9)',
          glass: 'rgba(255, 255, 255, 0.05)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#a1a1a1',
          tertiary: '#737373',
          muted: '#525252',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      spacing: {
        13: '3.25rem',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
