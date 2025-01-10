/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',  // Add this line to configure Tailwind to scan your project files
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D7C66',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },

    },
  },
  plugins: [],
}

