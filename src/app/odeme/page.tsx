'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import { Lock, MapPin, CreditCard, CheckCircle2, ChevronRight, ShieldCheck, ImageIcon } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [shippingRate, setShippingRate] = useState(0)
  const [shippingFreeThreshold, setShippingFreeThreshold] = useState(1000)
  
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
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }

      // Fetch Shipping Settings
      const { data } = await supabase.from('site_settings').select('shipping_free_threshold, shipping_flat_rate').single()
      if (data) {
        setShippingFreeThreshold(data.shipping_free_threshold || 1000)
        setShippingRate(data.shipping_flat_rate || 50)
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
        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center text-2xl">🛒</div>
        <h2 className="text-2xl font-bold font-heading">Sepetiniz Boş</h2>
        <p className="text-neutral-500">Ödeme adımına geçmek için önce ürün eklemelisiniz.</p>
        <button onClick={() => router.push('/kategori')} className="btn btn-primary mt-2">Alışverişe Başla</button>
      </div>
    )
  }

  const shippingValue = cartTotal >= shippingFreeThreshold ? 0 : shippingRate
  const grandTotal = cartTotal + shippingValue

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Yeni Adres Kaydı (Eğer var olanı seçme ekranı yapsaydık bu adımı atlardık)
      const { data: addressData, error: addressError } = await supabase
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
      const taxAmount = cartTotal * 0.20 // Örnek olarak KDV dahi içinde farz edip 20% logluyoruz
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          user_id: user?.id || null,
          status: 'pending', // Yönetici paketi hazırlarken görecek
          payment_method: 'credit_card',
          payment_status: 'paid', // Sistem test aşamasında başarılı farz eder
          subtotal: cartTotal,
          tax_amount: cartTotal * 0.20,
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

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert)
      if (itemsError) throw new Error('Siparişteki ürünler işlenirken hata oluştu.')

      // 3.5 Stokları Düşür
      for (const item of cart) {
        // Mevcut stoğu öğren (eşzamanlı satın alımlarda eksiye düşmeyi önlemek için veritabanından çekmek daha güvenli)
        const { data: pData } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single()
        if (pData && pData.stock_quantity !== undefined) {
          const newStock = Math.max(0, pData.stock_quantity - item.quantity)
          await supabase.from('products').update({ stock_quantity: newStock }).eq('id', item.id)
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
                <div className="flex items-center gap-2">
                  <div className="h-8 bg-neutral-50 rounded px-2 py-1 border border-neutral-200 flex items-center justify-center">
                    <img src="/visa.png" alt="Visa" className="h-full w-auto object-contain" />
                  </div>
                  <div className="h-8 bg-neutral-50 rounded px-2 py-1 border border-neutral-200 flex items-center justify-center">
                    <img src="/paytr.png" alt="PayTR" className="h-full w-auto object-contain" />
                  </div>
                  <div className="h-8 bg-neutral-50 rounded px-2 py-1 border border-neutral-200 flex items-center justify-center">
                    <img src="/mastercard.png" alt="Mastercard" className="h-full w-auto object-contain" />
                  </div>
                </div>
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
          </div>

        </form>
      </div>
    </div>
  )
}
