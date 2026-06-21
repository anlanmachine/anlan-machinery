import type { Config } from 'tailwindcss';
export default { content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{colors:{ink:'#111512',lime:'#d8ff36',sand:'#f4f1ea'},fontFamily:{sans:['var(--font-manrope)']}}},plugins:[]} satisfies Config;
