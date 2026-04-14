/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0F1E',
        card: '#0F1E3D',
        'secondary-card': '#162040',
        teal: {
          accent: '#00D4B8',
        },
        blue: {
          accent: '#1E90FF',
        },
        purple: {
          accent: '#7B5EA7',
        },
        red: {
          alert: '#FF4C4C',
        },
        orange: {
          warning: '#FF8C42',
        },
        text: {
          primary: '#FFFFFF',
          muted: '#8CA0C8',
        },
        border: {
          subtle: '#1E3A5F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        heading: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
