/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Menlo', 'monospace'],
      },
      colors: {
        bg: '#F8F9FB',
        surface: '#FFFFFF',
        'surface-muted': '#F3F4F6',
        border: '#E5E7EB',
        primary: {
          DEFAULT: '#111827',
          hover: '#1F2937',
          container: '#343B4C',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        success: {
          DEFAULT: '#3F6F5A',
          bg: '#ECF4EF',
          border: '#A7D3BF',
        },
        warning: {
          DEFAULT: '#9A7A3E',
          bg: '#F8F3E8',
          border: '#D4B97A',
        },
        danger: {
          DEFAULT: '#8E4B4B',
          bg: '#F8ECEC',
          border: '#D4A0A0',
        },
        info: {
          DEFAULT: '#4D617A',
          bg: '#EBF0F5',
          border: '#A0B4C8',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '12px',
        lg: '14px',
        pill: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
        md: '0 4px 12px rgba(15, 23, 42, 0.08)',
        lg: '0 8px 24px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
}
