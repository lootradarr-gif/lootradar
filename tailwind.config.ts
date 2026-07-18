import type { Config } from 'tailwindcss';

// solgames tasarım sistemi — nötr grafit zemin + elektrik mavisi tek vurgu, gradient pill butonlar.
// (Not: solgames.buzz'dan ayrışması için teal→mavi, mavi-siyah→nötr grafit, köşeli→pill.)
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0b0d',        // sayfa zemini (nötr near-black, mavi tint YOK)
        panel: '#121319',     // kart zemini
        panel2: '#181a22',    // ikincil kart
        line: '#252833',      // kenarlık
        line2: '#343947',     // hover kenarlık
        ink: '#eef1f6',       // ana metin
        dim: '#9aa4b2',       // ikincil metin
        faint: '#616b7a',     // en soluk
        acc: '#3d8bff',       // vurgu (elektrik mavisi)
        acc2: '#5eb0ff',      // vurgu-açık (gradient bitişi)
        accSoft: '#11203a',   // vurgu-soft zemin
        up: '#37d67a',        // yeşil (gainer)
        down: '#ff5c6c',      // kırmızı (loser)
        gold: '#ffc046',      // boost/star
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
