/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#000000',
          secondary: '#080808',
          card: '#1A161F',
          'card-hover': '#221D29',
          elevated: '#120F17',
        },
        accent: {
          purple: '#8E54E9',
          'purple-light': '#A875F0',
          'purple-dark': '#6C3BBF',
          'purple-glow': 'rgba(142, 84, 233, 0.15)',
          pink: '#FF49DB',
          'pink-glow': 'rgba(255, 73, 219, 0.15)',
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
          DEFAULT: '#2D2D2D',
          subtle: '#1F1F25',
          accent: 'rgba(142, 84, 233, 0.3)',
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
        'glow-purple': '0 0 40px rgba(142, 84, 233, 0.15)',
        'glow-pink': '0 0 30px rgba(255, 73, 219, 0.1)',
        'glow-sm': '0 0 15px rgba(142, 84, 233, 0.1)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #8E54E9 0%, #6C3BBF 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(142, 84, 233, 0.06) 0%, transparent 50%)',
        'gradient-radial-purple': 'radial-gradient(ellipse at 50% 0%, rgba(142, 84, 233, 0.12) 0%, transparent 70%)',
        'gradient-page': 'radial-gradient(ellipse at 20% 0%, rgba(142, 84, 233, 0.08) 0%, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
