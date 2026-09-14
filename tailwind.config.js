/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1F1917', // Dark warm charcoal text
          soft: '#574E4A',    // Medium warm text
          faint: '#8C827A',   // Light warm text
        },
        paper: {
          DEFAULT: '#FFF8F4', // Warm soft peach-tinted background
          raised: '#FFFFFF',  // Crisp white surface
          sunken: '#FFECE3',  // Light warm sunken container
        },
        peach: {
          light: '#FFEBE0',   // Soft light peach
          soft: '#FFC8B0',    // Medium peach border/pill
          DEFAULT: '#FF6B35', // Primary Vibrant Peach-Orange accent
          strong: '#E85A2A',  // Stronger hover peach-orange
          dark: '#C94518',    // Dark chocolate-orange
        },
        orange: {
          light: '#FFF0E5',   // Very light orange
          soft: '#FFD3B8',    // Soft orange border
          DEFAULT: '#FF7A18', // Bright vibrant orange
          strong: '#E66300',  // Deep orange
          dark: '#C45000',    // Dark orange accent
        },
        line: '#F4E3D8',      // Warm light peach-gray border line
        rail: {
          DEFAULT: '#FFF8F4',
          raised: '#FFFFFF',
          line: '#F4E3D8',
          text: '#1F1917',
        },
        signal: {
          DEFAULT: '#FF6B35', // Primary vibrant peach-orange
          soft: 'rgba(255, 107, 53, 0.12)',
          strong: '#E85A2A',
        },
        amber: {
          DEFAULT: '#FF9647', // Warm orange amber
          soft: 'rgba(255, 150, 71, 0.14)',
          strong: '#E66300',
        },
        rust: {
          DEFAULT: '#EF4444',
          soft: 'rgba(239, 68, 68, 0.1)',
        },
        indigo: {
          DEFAULT: '#FF6B35', // Mapped to primary vibrant peach-orange accent
          soft: '#FFEBE0',    // Mapped to light peach
          strong: '#E85A2A',  // Mapped to strong peach
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
