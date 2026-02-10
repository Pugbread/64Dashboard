/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#000000',
          secondary: '#0A0A0A',
          card: '#111111',
          'card-hover': '#161616',
          elevated: '#0D0D0D',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          muted: '#888888',
        },
        status: {
          success: '#22C55E',
          'success-bg': 'rgba(34, 197, 94, 0.1)',
          error: '#EF4444',
          'error-bg': 'rgba(239, 68, 68, 0.1)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#888888',
          muted: '#555555',
        },
        border: {
          DEFAULT: '#1E1E1E',
          subtle: '#181818',
          hover: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '4px',
      },
    },
  },
  plugins: [],
};
