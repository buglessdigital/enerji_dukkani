import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Enerji Dükkanı - Güneş Paneli ve Enerji Sistemleri',
    template: '%s | Enerji Dükkanı',
  },
  description:
    'Güneş panelleri, invertörler, akü sistemleri ve enerji çözümleri. Enerji Dükkanı ile güvenilir ve uygun fiyatlı enerji ürünlerine ulaşın.',
  keywords: [
    'güneş paneli',
    'solar panel',
    'inverter',
    'enerji sistemleri',
    'akü',
    'şarj kontrol',
  ],
  authors: [{ name: 'Enerji Dükkanı' }],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Enerji Dükkanı',
  },
}

import { CartProvider } from '@/context/CartContext'
import { FavoritesProvider } from '@/context/FavoritesContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-neutral-50 text-neutral-800 antialiased">
        <FavoritesProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </FavoritesProvider>
      </body>
    </html>
  )
}
