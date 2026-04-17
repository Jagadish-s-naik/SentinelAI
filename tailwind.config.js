/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Kalvium Design System ──────────────────────────────
        background: '#FFFFFF',          // Page background (white)
        card:       '#FAFAFA',          // Card surface
        'secondary-card': '#F3F4F6',   // Secondary card / hover
        sidebar:    '#0D0D0D',          // Sidebar ONLY
        'sidebar-hover': '#1A1A1A',    // Sidebar item hover

        // Primary accent
        red: {
          accent:  '#E53935',           // Primary CTA / active
          light:   '#FFF1F0',           // CRITICAL bg
          muted:   '#FECACA',           // softer red
        },

        // Severity system
        critical: { bg: '#FFF1F0', text: '#E53935', border: '#FECACA' },
        high:     { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
        medium:   { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
        low:      { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },

        // Text
        text: {
          primary:   '#111827',
          secondary: '#6B7280',
          muted:     '#9CA3AF',
        },

        // Borders
        border: {
          subtle: '#E5E7EB',
          medium: '#D1D5DB',
        },

        // Status / misc
        success: '#22C55E',
        warning: '#F59E0B',
        info:    '#3B82F6',

        // Compatibility aliases (for pages that still use old token names)
        'teal-accent':      '#E53935',   // remapped to red accent
        'blue-accent':      '#3B82F6',
        'purple-accent':    '#7C3AED',
        'red-alert':        '#E53935',
        'orange-warning':   '#EA580C',
        'border-subtle':    '#E5E7EB',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Consolas', 'monospace'],
        heading: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1': ['28px', { fontWeight: '700', lineHeight: '1.2' }],
        'h2': ['22px', { fontWeight: '600', lineHeight: '1.3' }],
        'h3': ['16px', { fontWeight: '600', lineHeight: '1.4' }],
        'label': ['11px', { fontWeight: '600', lineHeight: '1', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        panel: '0 4px 16px rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.12)',
        toast: '0 4px 12px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in':      'fadeIn 0.2s ease-out',
        'slide-in':     'slideIn 0.25s ease-out',
        'slide-right':  'slideRight 0.3s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':      'shimmer 1.5s infinite linear',
        'spin-slow':    'spin 8s linear infinite',
        'ticker':       'ticker 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
