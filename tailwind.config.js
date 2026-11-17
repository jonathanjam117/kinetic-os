/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#09090B',
        panel: '#121215',
        'panel-subtle': '#18181C',
        'border-dim': '#27272A',
        'border-active': '#3F3F46',
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#52525B'
        },
        accent: {
          primary: '#E4E4E7',
          hover: '#FFFFFF'
        },
        status: {
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      borderRadius: {
        'panel': '6px',
        'btn': '4px'
      },
      letterSpacing: {
        'tight-heading': '-0.02em',
      }
    },
  },
  plugins: [],
}
