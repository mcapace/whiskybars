import type { Metadata } from 'next'
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "America's Top Whisky Bars 2025 | Whisky Advocate",
  description: "America's Top Whisky Bars honors the places where exceptional whisky, true hospitality, and atmosphere converge. Discover 250+ remarkable venues setting the standard for whisky culture nationwide.",
  keywords: 'whisky bars, bourbon bars, scotch bars, whiskey, cocktails, America, best bars',
  openGraph: {
    title: "America's Top Whisky Bars 2025",
    description: 'Discover the best whisky bars across America',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
