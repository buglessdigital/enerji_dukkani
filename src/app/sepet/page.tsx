'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, ShieldCheck, ImageIcon } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { supabase } from '@/lib/supabase'

function formatPrice(p: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p)
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart()
  const [shippingFreeThreshold, setShippingFreeThreshold] = useState(0)
  const [shippingRate, setShippingRate] = useState(0)
  
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('shipping_free_threshold, shipping_flat_rate').single()
      if (data) {
        setShippingFreeThreshold(data.shipping_free_threshold || 1000)
        setShippingRate(data.shipping_flat_rate || 50)
      }
    }
    fetchSettings()
  }, [])

  const shippingCost = cartTotal >= shippingFreeThreshold ? 0 : shippingRate
  const finalTotal = cartTotal + shippingCost
  const remainingForFreeShipping = shippingFreeThreshold - cartTotal

  return (
    <>
      <Navbar />
      
      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 min-h-screen pb-20">
        <div className="container-custom py-8">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">Sepetim</h1>
              <p className="text-sm text-neutral-500">{cartCount} ürün bulunuyor</p>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-12 text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Sepetiniz Boş</h2>
              <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                Sepetinizde henüz ürün bulunmuyor. Dünyanın en iyi güneş panellerini keşfetmek ve alışverişe başlamak için mağazamızı ziyaret edebilirsiniz.
              </p>
              <Link href="/" className="btn btn-primary inline-flex px-8 py-3">
                Alışverişe Başla <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Product List */}
              <div className="lg:w-2/3 space-y-4">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 flex items-center justify-between">
                  <h2 className="font-bold text-neutral-900">Gönderim Yapılacak Ürünler</h2>
                  <button onClick={clearCart} className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1">
                     <Trash2 className="w-4 h-4" /> Sepeti Temizle
                  </button>
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-neutral-100 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative group">
                    
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-neutral-200 relative p-2">
                       {item.image_url ? (
                         <Image src={item.image_url} alt={item.name} fill className="object-contain p-2" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center opacity-20 text-3xl"><ImageIcon className="w-8 h-8 text-neutral-400" /></div>
                       )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0 pr-8">
                       <Link href={`/urun/${item.slug}`} className="font-bold text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2 text-lg mb-1">
                         {item.name}
                       </Link>
                       <p className="text-sm font-medium text-primary-600 mb-3 block">
                          Birim Fiyat: {formatPrice(item.sale_price || item.price)}
                       </p>
                       
                       <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 disabled:opacity-50">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-bold text-neutral-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock_quantity} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 disabled:opacity-50">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {item.quantity >= item.stock_quantity && <span className="text-[10px] text-amber-600 ml-2 font-medium bg-amber-50 px-2 py-0.5 rounded">Maks. Stok</span>}
                       </div>
                    </div>

                    {/* Total Price */}
                    <div className="hidden sm:block text-right">
                       <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Toplam</p>
                       <p className="font-extrabold text-neutral-900 font-heading text-lg whitespace-nowrap">
                         {formatPrice((item.sale_price || item.price) * item.quantity)}
                       </p>
                    </div>

                    {/* Delete Current Product */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 sticky top-32">
                  <h2 className="text-xl font-bold text-neutral-900 font-heading mb-6">Sipariş Özeti</h2>
                  
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between text-neutral-600">
                      <span>Ara Toplam ({cartCount} Ürün)</span>
                      <span className="font-medium text-neutral-900">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Kargo Ücreti</span>
                      <span className="font-medium text-neutral-900">
                        {shippingCost === 0 ? <span className="text-green-600 font-bold">Ücretsiz</span> : formatPrice(shippingRate)}
                      </span>
                    </div>
                  </div>

                  {remainingForFreeShipping > 0 ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
                      <p className="text-xs text-blue-800 font-medium text-center">
                        Sepetinize <b className="text-blue-900">{formatPrice(remainingForFreeShipping)}</b> tutarında ürün daha ekleyin, <b className="text-blue-900">Kargo Bedava</b> olsun!
                      </p>
                      <div className="w-full bg-blue-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (cartTotal / shippingFreeThreshold) * 100)}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-6 flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <p className="text-xs text-green-800 font-medium">Tebrikler! <b className="text-green-900">Ücretsiz Kargo</b> kazandınız.</p>
                    </div>
                  )}

                  <div className="border-t border-neutral-100 pt-4 mb-8">
                    <div className="flex items-end justify-between">
                      <span className="font-bold text-neutral-900">Genel Toplam</span>
                      <span className="text-2xl font-extrabold text-primary-700 font-heading leading-none">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <Link href="/odeme" className="btn btn-primary w-full py-4 text-base shadow-md mb-3">
                    Güvenli Ödeme Yap <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link href="/" className="btn btn-outline w-full text-sm">
                    Alışverişe Dön
                  </Link>
                  
                  <div className="mt-6 flex flex-wrap gap-2 justify-center items-center opacity-60">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Geçerli Kartlar:</span>
                    <img src="https://static.ticimax.cloud/cdn-cgi/image/width=50/3382/customcss/images/visa.png" alt="Visa" className="h-4" />
                    <img src="https://static.ticimax.cloud/cdn-cgi/image/width=50/3382/customcss/images/mastercard.png" alt="Mastercard" className="h-4" />
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
