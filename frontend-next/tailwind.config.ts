import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#cc7a60',
          hover: '#b86d54',
          subtle: '#F0DDD6',
        },
        secondary: {
          DEFAULT: '#7A9B94',
          hover: '#6A8B84',
          subtle: '#DDE8E6',
        },
        background: '#F8F5F1',
        surface: '#FFFFFF',
        'surface-raised': '#F3EFE9',
        'surface-overlay': '#EDEBE6',
        text: {
          primary: '#2C2420',
          secondary: '#7A6E68',
          muted: '#ADA39C',
          inverse: '#F8F5F1',
        },
        border: {
          DEFAULT: '#E5E0DA',
          strong: '#CBC5BE',
          focus: '#cc7a60',
        },
        error: {
          DEFAULT: '#C47A7A',
          subtle: '#F5E5E5',
        },
        warning: {
          DEFAULT: '#C4A060',
          subtle: '#F5EDD8',
        },
        success: {
          DEFAULT: '#7A9B7E',
          subtle: '#DDE8DE',
        },
        info: {
          DEFAULT: '#7A8FA3',
          subtle: '#DDE4EC',
        },
      },
      fontFamily: {
        display: ['Cagliostro', 'serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['mononoki', 'IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['22px', { lineHeight: '1.4' }],
        '2xl': ['28px', { lineHeight: '1.3' }],
        '3xl': ['36px', { lineHeight: '1.2' }],
        display: ['48px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '4px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        flat: 'none',
        raised: '0 1px 3px rgba(44,36,32,0.08)',
        floating: '0 4px 12px rgba(44,36,32,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
