import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Playfair Display"', "serif"],
                sans: ['"Inter"', "sans-serif"],
            },
            colors: {
                museum: {
                    background: "#F2EFE9", // Warmer ivory, more human/paper-like
                    text: "#2C2C2A",      // Softer, slightly warm dark grey
                    darkText: "#F5F2EB", // Warm cream white
                    border: "#D6D3CD",    // Textured grey border
                    accent: "#C59B27",    // Deep authentic bronze/gold
                },
            },
            boxShadow: {
                '3d-light': '10px 10px 30px rgba(0,0,0,0.05), -10px -10px 30px rgba(255,255,255,0.8), inset 2px 2px 5px rgba(255,255,255,1), inset -2px -2px 5px rgba(0,0,0,0.02)',
                '3d-dark': '10px 10px 30px rgba(0,0,0,0.5), -10px -10px 30px rgba(40,40,40,0.5), inset 2px 2px 5px rgba(255,255,255,0.05), inset -2px -2px 5px rgba(0,0,0,0.3)',
                'pop': '0 20px 40px -10px rgba(0,0,0,0.2), 0 0 20px rgba(0,0,0,0.05)',
                'pop-dark': '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.02)',
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [],
};
export default config;
