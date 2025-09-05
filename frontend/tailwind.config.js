/** @type {import('tailwindcss').Config} */
const config = {
  // Minimal config for Tailwind v4 - most configuration moved to CSS @theme
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  // Plugins are now loaded via @plugin directive in CSS
};

export default config;
