/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1f1f1f',
          600: '#2b2b2b'
        },
        primary: '#3b82f6', // blue-500
        danger: '#ef4444', // red-500
        warning: '#f59e0b', // amber-500
        success: '#10b981', // emerald-500
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
