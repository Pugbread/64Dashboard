/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080808',
          secondary: '#0E0E10',
          card: '#121214',
          'card-hover': '#18181C',
          elevated: '#1A1A1E',
        },
        accent: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#1D4ED8',
          muted: 'rgba(59, 130, 246, 0.15)',
        },
        status: {
          success: '#4ADE80',
          'success-bg': 'rgba(74, 222, 128, 0.10)',
          danger: '#F87171',
          'danger-bg': 'rgba(248, 113, 113, 0.10)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        border: {
          DEFAULT: '#1E1E22',
          subtle: '#161618',
          accent: 'rgba(59, 130, 246, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        pill: '20px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5)',
        glow: '0 0 30px rgba(59, 130, 246, 0.12)',
        'glow-strong': '0 0 50px rgba(59, 130, 246, 0.20)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
        'gradient-active': 'linear-gradient(90deg, rgba(59, 130, 246, 0.20) 0%, rgba(59, 130, 246, 0.05) 100%)',
      },
    },
  },
  plugins: [],
};
