/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#55644A',
        secondary: 'rgba(0, 0, 0, 0.03)',
        background: '#F6F4F1',
        surface: '#FFFFFF',
        textPrimary: 'rgba(0, 0, 0, 0.95)',
        textSecondary: 'rgba(0, 0, 0, 0.65)',
        border: 'rgba(0, 0, 0, 0.06)',
        error: '#D42727',
        link: '#0077FF',
      },
      fontFamily: {
        heading: ['Courier Prime', 'monospace'],
        body: ['Courier Prime', 'monospace'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '14px', // 默认正文
        'lg': '16px',
        'xl': '20px',
        '2xl': '32px',
      },
      fontWeight: {
        regular: '400',
        bold: '600',
      },
      lineHeight: {
        body: '1.5',
        heading: '1.2',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '10px', // 默认圆角
        'md': '10px',
        'lg': '16px',
      },
      boxShadow: {
        'level1': '0 1px 3px rgba(0,0,0,0.1)',
        'level2': '0 8px 12px rgba(0,0,0,0.1)',
        'level3': '0 16px 32px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}