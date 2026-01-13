/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                medical: {
                    bg: {
                        primary: '#0a0e1a',
                        secondary: '#151b2e',
                        tertiary: '#1e2638',
                    },
                    text: {
                        primary: '#e8eaf0',
                        secondary: '#9ca3af',
                        muted: '#6b7280',
                    },
                    accent: {
                        blue: '#3b82f6',
                        green: '#10b981',
                        red: '#ef4444',
                        yellow: '#f59e0b',
                        purple: '#8b5cf6',
                    },
                    border: '#2d3748',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s ease-in',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
