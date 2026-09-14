/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#292524', // Dark warm charcoal
          soft: '#78716C',    // Warm gray
          faint: '#A8A29E',   // Light warm gray
        },
        paper: {
          DEFAULT: '#FFFCF9', // Warm off-white primary background
          raised: '#FFFFFF',  // Pure white main surface
          sunken: '#FFF8F5',  // Subtle light warm neutral
        },
        peach: {
          light: '#FFF0E8',   // Very subtle peach
          soft: '#F8C9B0',    // Soft peach
          DEFAULT: '#F29B73', // Peach accent / CTA
          strong: '#E9825B',  // Stronger peach / hover
          dark: '#D97348',    // Darker peach
        },
        line: '#F1E8E3',      // Very light warm gray border
        rail: {
          DEFAULT: '#FFFCF9',
          raised: '#FFFFFF',
          line: '#F1E8E3',
          text: '#292524',
        },
        signal: {
          DEFAULT: '#10B981', // Soft emerald green
          soft: 'rgba(16, 185, 129, 0.1)',
          strong: '#059669',
        },
        amber: {
          DEFAULT: '#F59E0B',
          soft: 'rgba(245, 158, 11, 0.1)',
          strong: '#D97706',
        },
        rust: {
          DEFAULT: '#EF4444',
          soft: 'rgba(239, 68, 68, 0.1)',
        },
        indigo: {
          DEFAULT: '#F29B73', // Mapped to primary peach accent
          soft: '#FFF0E8',    // Mapped to light peach
          strong: '#E9825B',  // Mapped to strong peach
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '14px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
      },
      boxShadow: {
        card: '0 2px 10px -2px rgba(41, 37, 36, 0.05), 0 1px 3px rgba(41, 37, 36, 0.03)',
        panel: '0 8px 30px -6px rgba(242, 155, 115, 0.12), 0 4px 12px -2px rgba(41, 37, 36, 0.04)',
        float: '0 12px 36px -8px rgba(242, 155, 115, 0.18), 0 4px 16px -4px rgba(41, 37, 36, 0.06)',
        hover: '0 16px 40px -10px rgba(242, 155, 115, 0.22), 0 6px 20px -4px rgba(41, 37, 36, 0.08)',
        'glow-indigo': '0 0 25px rgba(242, 155, 115, 0.25)',
        'glow-peach': '0 0 25px rgba(242, 155, 115, 0.3)',
        'glow-signal': '0 0 25px rgba(16, 185, 129, 0.2)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.2)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
