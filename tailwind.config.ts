import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'montserrat': ['Montserrat', 'sans-serif'],
				'sans': ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'hero': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
				'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
				'title': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
				'heading': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
				'subheading': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
				'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
				'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
				'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
				'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				brand: {
					purple: 'hsl(var(--brand-purple))',
					pink: 'hsl(var(--brand-pink))',
					cyan: 'hsl(var(--brand-cyan))',
					lime: 'hsl(var(--brand-lime))',
					orange: 'hsl(var(--brand-orange))'
				},
				cta: {
					primary: 'hsl(var(--cta-primary))',
					'primary-hover': 'hsl(var(--cta-primary-hover))',
					secondary: 'hsl(var(--cta-secondary))',
					'secondary-hover': 'hsl(var(--cta-secondary-hover))',
					success: 'hsl(var(--cta-success))',
					warning: 'hsl(var(--cta-warning))',
					danger: 'hsl(var(--cta-danger))'
				},
				answer: {
					red: 'hsl(var(--answer-red))',
					blue: 'hsl(var(--answer-blue))',
					yellow: 'hsl(var(--answer-yellow))',
					green: 'hsl(var(--answer-green))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-cta': 'var(--gradient-cta)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-game': 'var(--gradient-game)',
				'gradient-celebration': 'var(--gradient-celebration)',
				'gradient-hover': 'var(--gradient-hover)'
			},
			boxShadow: {
				'cta': 'var(--shadow-cta)',
				'card': 'var(--shadow-card)',
				'card-hover': 'var(--shadow-card-hover)',
				'game': 'var(--shadow-game)',
				'answer': 'var(--shadow-answer)',
				'interactive': 'var(--shadow-interactive)'
			},
			transitionTimingFunction: {
				'bounce-in': 'var(--bounce-in)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'bounce-in': {
					'0%': {
						transform: 'scale(0.3)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(1.1)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'pulse-answer': {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: 'var(--shadow-answer)'
					},
					'50%': {
						transform: 'scale(1.05)',
						boxShadow: '0 8px 30px -8px hsl(var(--foreground) / 0.2)'
					}
				},
				'celebrate': {
					'0%, 100%': { transform: 'rotate(0deg) scale(1)' },
					'25%': { transform: 'rotate(-5deg) scale(1.1)' },
					'75%': { transform: 'rotate(5deg) scale(1.1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-8px)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'pulse-answer': 'pulse-answer 2s ease-in-out infinite',
				'celebrate': 'celebrate 0.6s ease-in-out',
				'float': 'float 3s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'fade-in': 'fade-in 0.5s ease-in'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
