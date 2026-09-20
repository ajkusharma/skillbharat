/** SkillBharat design tokens: the brand blues, light surface and success green come from the brief. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F8FF', // light surface
          100: '#E4EEFF',
          200: '#C7DBFF',
          300: '#9CBEFA',
          400: '#5F94EE',
          500: '#2A70DC',
          600: '#0755C9', // primary
          700: '#0B3B91', // dark
          800: '#0A2F73',
          900: '#08234F',
        },
        success: { DEFAULT: '#16A34A', soft: '#DCFCE7', ink: '#166534' },
        ink: '#0F1B33',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
      boxShadow: { lift: '0 12px 32px -12px rgba(11, 59, 145, 0.35)' },
    },
  },
  plugins: [],
};
