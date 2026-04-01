import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Outfit, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "America's Top Whisky Bars 2026 | Whisky Advocate",
  description: "America's Top Whisky Bars honors the places where exceptional whisky, true hospitality, and atmosphere converge. Discover 150+ remarkable venues setting the standard for whisky culture nationwide.",
  keywords: 'whisky bars, bourbon bars, scotch bars, whiskey, cocktails, America, best bars',
  openGraph: {
    title: "America's Top Whisky Bars 2026",
    description: 'Discover the best whisky bars across America',
    type: 'website',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} ${ibmMono.variable}`}>
      <body className="font-sans antialiased min-h-screen min-h-[100dvh]">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
