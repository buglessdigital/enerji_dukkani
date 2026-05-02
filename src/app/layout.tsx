import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import './globals.css'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    default: 'Enerji Ambarı - Güneş Paneli ve Enerji Sistemleri',
    template: '%s | Enerji Ambarı',
  },
  description:
    'Güneş panelleri, invertörler, akü sistemleri ve enerji çözümleri. Enerji Ambarı ile güvenilir ve uygun fiyatlı enerji ürünlerine ulaşın.',
  keywords: [
    'güneş paneli',
    'solar panel',
    'inverter',
    'enerji sistemleri',
    'akü',
    'şarj kontrol',
  ],
  authors: [{ name: 'Enerji Ambarı' }],
  icons: {
    icon: '/logo3.png',
    apple: '/logo3.png',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Enerji Ambarı',
  },
}

import { CartProvider } from '@/context/CartContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { DealerProvider } from '@/context/DealerContext'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  let initialIsDealer = false
  let initialDealerDiscount: number | null = null

  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    if (profile?.role === 'dealer') {
      const { data: dealer } = await supabase.from('dealers').select('discount_rate').eq('user_id', session.user.id).eq('is_active', true).single()
      initialIsDealer = true
      initialDealerDiscount = dealer?.discount_rate ?? null
    }
  }

  return (
    <html lang="tr" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-neutral-50 text-neutral-800 antialiased">
        <DealerProvider initialIsDealer={initialIsDealer} initialDealerDiscount={initialDealerDiscount}>
          <FavoritesProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </FavoritesProvider>
        </DealerProvider>
      </body>
    </html>
  )
}
