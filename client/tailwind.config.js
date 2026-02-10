/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#000000',
          secondary: '#060810',
          card: '#0C0F1A',
          'card-hover': '#111528',
          elevated: '#080B14',
        },
        accent: {
          blue: '#3B82F6',
          'blue-light': '#60A5FA',
          'blue-dark': '#1D4ED8',
          'blue-glow': 'rgba(59, 130, 246, 0.15)',
          cyan: '#22D3EE',
        },
        status: {
          success: '#4ADE80',
          'success-bg': 'rgba(74, 222, 128, 0.1)',
          error: '#FF4D4D',
          'error-bg': 'rgba(255, 77, 77, 0.1)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#6B6B76',
        },
        border: {
          DEFAULT: '#1A1D2E',
          subtle: '#131622',
          accent: 'rgba(59, 130, 246, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        'glow-blue': '0 0 40px rgba(59, 130, 246, 0.12)',
        'glow-sm': '0 0 15px rgba(59, 130, 246, 0.08)',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
};
