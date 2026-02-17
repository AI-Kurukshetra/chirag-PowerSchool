import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        midnight: '#0B1021',
        twilight: '#161F3D',
        accent: '#4FB3FF',
        success: '#45D483',
        warning: '#F2C94C',
        danger: '#EF476F'
      },
      boxShadow: {
        card: '0 10px 40px -20px rgba(0,0,0,0.4)'
      }
    },
  },
  plugins: [],
}

export default config
