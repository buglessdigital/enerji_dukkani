'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Info } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  const [form, setForm] = useState({
    site_name: '', company_name: '', email: '', support_email: '',
    phone: '', phone_secondary: '', whatsapp_number: '', whatsapp_enabled: true,
    address: '', map_embed_code: '', logo_url: '', dark_logo_url: '',
    footer_logo_url: '', favicon_url: '',
    instagram_url: '', linkedin_url: '', facebook_url: '', youtube_url: '', twitter_url: '',
    shipping_free_threshold: '500', shipping_flat_rate: '0',
    usd_exchange_rate: '35.0',
    maintenance_mode: false,
    feature_shipping_title: 'Ücretsiz & Hızlı Kargo',
    feature_shipping_desc: 'Özenle paketlenmiş sigortalı gönderim',
    feature_guarantee_title: 'Orijinal Ürün Garantisi',
    feature_guarantee_desc: 'Resmi distribütör veya üretici garantisi',
    feature_return_title: 'Kolay İade & Değişim',
    feature_return_desc: '14 gün içerisinde koşulsuz iade hakkı',
    delivery_shipping_text: 'Siparişleriniz, onaylandıktan sonra 1-3 iş günü içerisinde kargoya teslim edilmektedir.',
    delivery_return_text: 'Satın aldığınız ürünleri, teslimat tarihinden itibaren 14 gün içerisinde iade edebilirsiniz.',
    hero_fallback_badge: 'Enerji Çözümleri',
    hero_fallback_title: 'Güneş Enerjisi ile Geleceği Aydınlatın',
    hero_fallback_description: 'Yüksek verimli güneş panelleri ve inverter sistemleri ile enerji maliyetlerinizi düşürün.',
  })

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single()
      if (data) {
        setSettingsId(data.id)
        const sanitizedData = Object.fromEntries(
          Object.entries(data).map(([key, val]) => [key, val === null ? '' : val])
        )
        setForm(prev => ({
          ...prev,
          ...sanitizedData,
          shipping_free_threshold: data.shipping_free_threshold?.toString() || '0',
          shipping_flat_rate: data.shipping_flat_rate?.toString() || '0',
          usd_exchange_rate: data.usd_exchange_rate?.toString() || '35.0',
        }))
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, fieldName: string) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploadingField(fieldName)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${fieldName}-${Date.now()}.${fileExt}`
      const filePath = `settings/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('slider_images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('slider_images')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, [fieldName]: publicUrl }))
    } catch (err: any) {
      alert(`Yükleme hatası: ${err.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const updates = {
      ...form,
      shipping_free_threshold: parseFloat(form.shipping_free_threshold) || 0,
      shipping_flat_rate: parseFloat(form.shipping_flat_rate) || 0,
      usd_exchange_rate: parseFloat(form.usd_exchange_rate) || 35.0,
    }

    if (!settingsId) { setError('Ayar kaydı bulunamadı.'); setSaving(false); return }
    const { error: updateError } = await supabase.from('site_settings').update(updates).eq('id', settingsId)
    
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Ayarlar başarıyla güncellendi.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-48 skeleton rounded" />
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"><div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-10 skeleton rounded" />)}</div></div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 font-heading">Genel Ayarlar</h1>
        <p className="text-sm text-neutral-500 mt-1">Sitenizin temel bilgilerini, iletişim kanallarını ve operasyonel ayarlarını yönetin.</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Temel Bilgiler</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Site Adı</label><input type="text" name="site_name" value={form.site_name} onChange={handleChange} required className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Şirket Ünvanı</label><input type="text" name="company_name" value={form.company_name} onChange={handleChange} className="input" /></div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">İletişim Bilgileri</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Ana E-Posta</label><input type="email" name="email" value={form.email} onChange={handleChange} required className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Destek E-Posta (Opsiyonel)</label><input type="email" name="support_email" value={form.support_email} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Ana Telefon</label><input type="text" name="phone" value={form.phone} onChange={handleChange} required className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">İkinci Telefon (Opsiyonel)</label><input type="text" name="phone_secondary" value={form.phone_secondary} onChange={handleChange} className="input" /></div>
            <div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium text-neutral-700">Açık Adres</label><textarea name="address" value={form.address} onChange={handleChange} rows={3} className="input resize-y" /></div>
            <div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium text-neutral-700">Harita Embed Kodu (HTML)</label><textarea name="map_embed_code" value={form.map_embed_code} onChange={handleChange} rows={3} className="input resize-y font-mono text-xs" /></div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">WhatsApp Destek</h2>
              <p className="text-xs text-neutral-500 mt-1">Sitenin sağ alt köşesindeki hızlı mesaj butonu</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer relative">
              <input type="checkbox" name="whatsapp_enabled" checked={form.whatsapp_enabled} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          {form.whatsapp_enabled && (
             <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">WhatsApp Numarası</label><input type="text" name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} className="input" placeholder="Örn: 905551234567 (Başında 0 olmadan)" /></div>
          )}
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Sosyal Medya Linkleri</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Instagram URL</label><input type="url" name="instagram_url" value={form.instagram_url} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">LinkedIn URL</label><input type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Facebook URL</label><input type="url" name="facebook_url" value={form.facebook_url} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">YouTube URL</label><input type="url" name="youtube_url" value={form.youtube_url} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Twitter (X) URL</label><input type="url" name="twitter_url" value={form.twitter_url} onChange={handleChange} className="input" /></div>
          </div>
        </div>


        {/* Currency Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Döviz Kuru</h2>
            <p className="text-xs text-neutral-500 mt-1">Ürün fiyatları dolar cinsinden girildiğinde TL'ye çevirmek için kullanılır.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">1 USD = ? TL</label>
              <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                <span className="px-3 flex items-center bg-neutral-100 text-neutral-500 text-sm font-bold border-r border-neutral-200 whitespace-nowrap">$1 =</span>
                <input type="number" name="usd_exchange_rate" value={form.usd_exchange_rate} onChange={handleChange} className="flex-1 px-3 py-2 text-sm outline-none" min="0" step="0.01" />
                <span className="px-3 flex items-center bg-neutral-100 text-neutral-500 text-sm font-bold border-l border-neutral-200 whitespace-nowrap">₺</span>
              </div>
              <p className="text-xs text-neutral-500">Ürün formunda USD seçildiğinde bu kur üzerinden TL fiyat hesaplanır.</p>
            </div>
          </div>
        </div>

        {/* E-commerce Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">E-Ticaret Operasyon</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Ücretsiz Kargo Limiti (₺)</label>
              <input type="number" name="shipping_free_threshold" value={form.shipping_free_threshold} onChange={handleChange} className="input" min="0" step="0.01" />
              <p className="text-xs text-neutral-500">Bu tutarın üzerindeki siparişlerde kargo ücretsiz olur.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Standart Kargo Ücreti (₺)</label>
              <input type="number" name="shipping_flat_rate" value={form.shipping_flat_rate} onChange={handleChange} className="input" min="0" step="0.01" />
            </div>
          </div>
        </div>

        {/* Hero Slider Fallback */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Ana Sayfa Hero — Yedek İçerik</h2>
            <p className="text-xs text-neutral-500 mt-1">Slider'da hiç aktif slayt yokken gösterilecek içerik.</p>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Rozet Metni</label><input type="text" name="hero_fallback_badge" value={form.hero_fallback_badge} onChange={handleChange} className="input" placeholder="Enerji Çözümleri" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Başlık</label><input type="text" name="hero_fallback_title" value={form.hero_fallback_title} onChange={handleChange} className="input" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Açıklama</label><textarea name="hero_fallback_description" value={form.hero_fallback_description} onChange={handleChange} rows={2} className="input resize-y" /></div>
        </div>

        {/* Product Feature Highlights */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Ürün Detayı — Öne Çıkan Özellikler</h2>
            <p className="text-xs text-neutral-500 mt-1">Ürün sayfasında görünen 3 kutucuğun başlık ve alt metinleri.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Kargo Başlığı</label><input type="text" name="feature_shipping_title" value={form.feature_shipping_title} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Kargo Alt Metin</label><input type="text" name="feature_shipping_desc" value={form.feature_shipping_desc} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Garanti Başlığı</label><input type="text" name="feature_guarantee_title" value={form.feature_guarantee_title} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Garanti Alt Metin</label><input type="text" name="feature_guarantee_desc" value={form.feature_guarantee_desc} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">İade Başlığı</label><input type="text" name="feature_return_title" value={form.feature_return_title} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">İade Alt Metin</label><input type="text" name="feature_return_desc" value={form.feature_return_desc} onChange={handleChange} className="input" /></div>
          </div>
        </div>

        {/* Delivery & Return Texts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Ürün Detayı — Teslimat ve İade Sekmesi</h2>
            <p className="text-xs text-neutral-500 mt-1">Ürün sayfasındaki "Teslimat ve İade" sekmesinin içerik metinleri.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Gönderim Süreci Metni</label>
            <textarea name="delivery_shipping_text" value={form.delivery_shipping_text} onChange={handleChange} rows={4} className="input resize-y" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">İade Koşulları Metni</label>
            <textarea name="delivery_return_text" value={form.delivery_return_text} onChange={handleChange} rows={4} className="input resize-y" />
          </div>
        </div>

        {/* System */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-red-600">Bakım Modu</h2>
              <p className="text-xs text-neutral-500 mt-1">Açıldığında site ziyaretçilere kapatılır, sadece adminler görebilir.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer relative">
              <input type="checkbox" name="maintenance_mode" checked={form.maintenance_mode} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-6 z-10">
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg shadow-lg">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</> : <><Save className="w-4 h-4" /> Tüm Ayarları Kaydet</>}
          </button>
        </div>
      </form>
    </div>
  )
}
