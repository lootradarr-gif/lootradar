import type { Config } from 'tailwindcss';

// LootRadar tasarım sistemi — renkler CSS değişkenlerine bağlı (globals.css :root / :root.light).
// Böylece gece/gündüz teması tek sınıf değişimiyle (html.light) çalışır. Opacity modifier'ları
// (bg-panel/60 vb.) için değerler "R G B" formatında + rgb(var() / <alpha-value>).
const c = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        panel: c('panel'),
        panel2: c('panel2'),
        line: c('line'),
        line2: c('line2'),
        ink: c('ink'),
        dim: c('dim'),
        faint: c('faint'),
        acc: c('acc'),
        acc2: c('acc2'),
        accSoft: c('accsoft'),
        up: c('up'),
        down: c('down'),
        gold: c('gold'),
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 6px 24px -6px rgba(61,139,255,0.45)',
        card: '0 10px 34px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        acc: 'linear-gradient(135deg, #3d8bff 0%, #5eb0ff 100%)',
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        pulse2: 'pulse2 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
