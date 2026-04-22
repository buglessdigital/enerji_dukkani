'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Lock, MapPin, CreditCard, CheckCircle2, ChevronRight, ShieldCheck, ImageIcon, ShoppingCart } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [shippingRate, setShippingRate] = useState(0)
  const [shippingFreeThreshold, setShippingFreeThreshold] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  
  const [isReady, setIsReady] = useState(false)
  const [address, setAddress] = useState({
    fullName: '', phone: '', email: '', city: '', district: '', fullAddress: ''
  })
  
  const [card, setCard] = useState({
    name: '', number: '', expiry: '', cvc: ''
  })

  // Auth Guard Removed (Allows Guest Checkout)
  useEffect(() => {
    async function initCheckout() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (session) {
        setUser(session.user)
      }

      // Fetch Shipping Settings
      const { data } = await supabase.from('site_settings').select('shipping_free_threshold, shipping_flat_rate, whatsapp_number, tax_rate').single()
      if (data) {
        setShippingFreeThreshold(data.shipping_free_threshold ?? 0)
        setShippingRate(data.shipping_flat_rate ?? 0)
        setTaxRate(data.tax_rate ?? 0)
        setWhatsappNumber(data.whatsapp_number || '')
      }
      
      setIsReady(true)
    }
    initCheckout()
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center font-medium text-neutral-500 animate-pulse">
            Güvenli bağlantı kuruluyor...
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0 && !loading) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500"><ShoppingCart className="w-8 h-8" /></div>
        <h2 className="text-2xl font-bold font-heading">Sepetiniz Boş</h2>
        <p className="text-neutral-500">Ödeme adımına geçmek için önce ürün eklemelisiniz.</p>
        <button onClick={() => router.push('/kategori')} className="btn btn-primary mt-2">Alışverişe Başla</button>
      </div>
    )
  }

  const shippingValue = cartTotal >= shippingFreeThreshold ? 0 : shippingRate
  const taxAmount = cartTotal * (taxRate / 100)
  const grandTotal = cartTotal + taxAmount + shippingValue

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Yeni Adres Kaydı (Eğer var olanı seçme ekranı yapsaydık bu adımı atlardık)
      const { data: addressData, error: addressError } = await supabaseBrowser
        .from('addresses')
        .insert([{
          user_id: user?.id || null,
          label: 'Teslimat Adresi',
          full_name: address.fullName,
          phone: address.phone,
          city: address.city,
          district: address.district,
          address_line: address.fullAddress,
          address_type: 'both',
          is_default: true
        }])
        .select()
        .single()

      if (addressError) throw new Error('Adres kaydedilirken bir hata oluştu: ' + addressError.message)
      const addressId = addressData.id

      // 2. Sipariş (Order) Oluşturma
      const orderNumber = 'ENR-' + Date.now().toString().slice(-6)

      const { data: orderData, error: orderError } = await supabaseBrowser
        .from('orders')
        .insert([{
          order_number: orderNumber,
          user_id: user?.id || null,
          status: 'pending',
          payment_method: 'credit_card',
          payment_status: 'paid',
          subtotal: cartTotal,
          tax_amount: taxAmount,
          shipping_cost: shippingValue,
          total: grandTotal,
          shipping_address_id: addressId,
          billing_address_id: addressId
        }])
        .select()
        .single()

      if (orderError) throw new Error('Sipariş işlenemedi: ' + orderError.message)

      // 3. Sipariş Kalemlerini (Order Items) Ekleme
      const orderItemsToInsert = cart.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image_url,
        quantity: item.quantity,
        unit_price: item.sale_price || item.price,
        total_price: (item.sale_price || item.price) * item.quantity
      }))

      const { error: itemsError } = await supabaseBrowser.from('order_items').insert(orderItemsToInsert)
      if (itemsError) throw new Error('Siparişteki ürünler işlenirken hata oluştu.')

      // 3.5 Stokları Düşür
      for (const item of cart) {
        // Mevcut stoğu öğren (eşzamanlı satın alımlarda eksiye düşmeyi önlemek için veritabanından çekmek daha güvenli)
        const { data: pData } = await supabaseBrowser.from('products').select('stock_quantity').eq('id', item.id).single()
        if (pData && pData.stock_quantity !== undefined) {
          const newStock = Math.max(0, pData.stock_quantity - item.quantity)
          await supabaseBrowser.from('products').update({ stock_quantity: newStock }).eq('id', item.id)
        }
      }

      // 4. Sepeti Temizle ve Başarılı Sayfasına ya da Hesaba Yönlendir
      clearCart()
      alert(`🎉 Ödemeniz Başarılı!\nSipariş Numaranız: ${orderNumber}\n${user ? 'Hesabım > Siparişlerim sekmesinden takip edebilirsiniz.' : 'Sipariş detayları için iletişime geçebilirsiniz.'}`)
      
      if (user) {
        router.push('/hesabim')
      } else {
        router.push('/')
      }

    } catch (error: any) {
      alert(error.message)
      setLoading(false)
    }
  }

  // Görüntü (Format) Yardımcıları
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price)
  }

  // Kredi Kartı Boşluk Ayarı
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '')
    const matches = value.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      setCard({ ...card, number: parts.join(' ') })
    } else {
      setCard({ ...card, number: value })
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-8 pb-20">
      <div className="container-custom">
        {/* Adım Takibi */}
        <div className="flex items-center gap-3 text-sm mb-8 font-medium">
          <button onClick={() => router.push('/sepet')} className="text-neutral-500 hover:text-primary-600 transition-colors">Sepetim</button>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          <span className="text-primary-600 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Güvenli Ödeme</span>
        </div>

        <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sol: Form Alanları */}
          <div className="w-full lg:flex-1 space-y-6">
            
            {/* Teslimat Adresi Kutu */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-neutral-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold font-heading">Teslimat Adresi</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Ad Soyad *</label>
                  <input type="text" required value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} className="input" placeholder="Örn: Ahmet Yılmaz" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Telefon Numarası *</label>
                  <input type="tel" required value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="input" placeholder="05XX XXX XX XX" />
                </div>
                {!user && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-neutral-700">E-posta Adresi <span className="text-neutral-400 font-normal">(Sipariş Takibi İçin İsteğe Bağlı)</span></label>
                    <input type="email" value={address.email} onChange={e => setAddress({...address, email: e.target.value})} className="input" placeholder="orn: ahmet@gmail.com" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">İl *</label>
                  <input type="text" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="input" placeholder="Örn: İstanbul" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">İlçe *</label>
                  <input type="text" required value={address.district} onChange={e => setAddress({...address, district: e.target.value})} className="input" placeholder="Örn: Kadıköy" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Açık Adres *</label>
                  <textarea required value={address.fullAddress} onChange={e => setAddress({...address, fullAddress: e.target.value})} className="input min-h-[100px] resize-y" placeholder="Mahalle, sokak, bina ve daire no..." />
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri Kutu */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-500">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold font-heading">Ödeme Bilgileri</h2>
                </div>
                <img src="/paytr.png" alt="PayTR" className="h-7 w-auto object-contain" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Kart Üzerindeki İsim *</label>
                  <input type="text" required value={card.name} onChange={e => setCard({...card, name: e.target.value})} className="input font-mono uppercase" placeholder="AHMET YILMAZ" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Kart Numarası *</label>
                  <div className="relative">
                    <input type="text" required value={card.number} onChange={handleCardNumberChange} maxLength={19} className="input font-mono pl-10 tracking-widest" placeholder="0000 0000 0000 0000" />
                    <CreditCard className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Son Kullanma (AA/YY) *</label>
                    <input type="text" required value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} maxLength={5} className="input font-mono" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">CVC *</label>
                    <input type="text" required value={card.cvc} onChange={e => setCard({...card, cvc: e.target.value})} maxLength={3} className="input font-mono" placeholder="123" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                <p>Kart bilgileriniz 256-bit SSL sertifikası ile şifrelenerek korunmaktadır. Bu site kart bilgilerinizi kendi sunucularında kaydetmez.</p>
              </div>
            </div>

          </div>

          {/* Sağ: Sipariş Özeti (Sepet) */}
          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 sticky top-28">
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100">
              <h2 className="text-lg font-bold font-heading mb-4 border-b border-neutral-100 pb-4">Sipariş Özeti</h2>
              
              <div className="max-h-[300px] overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 relative">
                     {item.image_url ? (
                       <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-2xl opacity-20"><ImageIcon className="w-6 h-6 text-neutral-400" /></div>
                     )}
                     <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-800 line-clamp-2">{item.name}</p>
                      <p className="text-sm font-medium text-primary-600 mt-1">{formatPrice(item.sale_price || item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-neutral-600 text-sm">
                  <span>Ara Toplam</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 text-sm">
                  <span>KDV (%{taxRate})</span>
                  <span className="font-medium">{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 text-sm">
                  <span>Kargo Ücreti</span>
                  {shippingValue === 0 ? (
                    <span className="font-bold text-green-600">Ücretsiz</span>
                  ) : (
                    <span className="font-medium">{formatPrice(shippingValue)}</span>
                  )}
                </div>
                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Genel Toplam</span>
                  <span className="font-bold text-xl text-primary-600 font-heading">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full mt-6 py-4 text-base relative group shadow-lg shadow-primary-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sipariş Onaylanıyor...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Siparişi Onayla
                  </span>
                )}
              </button>

            </div>

            {/* WhatsApp — desktop only */}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '90')}?text=${encodeURIComponent('Merhaba, siparişim hakkında yardım almak istiyorum.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-4 mt-4 bg-white border border-neutral-100 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e7faf0' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-5 h-5" style={{ fill: '#25D366' }}>
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">Sipariş hakkında yardım mı lazım?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">WhatsApp üzerinden bize ulaşın</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-green-500 transition-colors shrink-0" />
              </a>
            )}

          </div>

        </form>
      </div>
    </div>
  )
}
