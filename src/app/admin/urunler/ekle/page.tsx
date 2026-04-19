'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X, Upload, Loader2 } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false, 
  loading: () => <div className="h-[200px] skeleton rounded-xl" /> 
})
import 'react-quill-new/dist/quill.snow.css'
import { convertToWebP } from '@/lib/imageUtils'

export default function AddProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [usdRate, setUsdRate] = useState<number>(35.0)
  const [priceCurrency, setPriceCurrency] = useState<'TRY' | 'USD'>('TRY')
  const [form, setForm] = useState({
    name: '', slug: '', brand: '', category_id: '', sku: '',
    price: '', sale_price: '', cost_price: '', dealer_price: '',
    discount_percent: '', stock_quantity: '0',
    short_description: '', description: '',
    is_active: true, is_featured: false,
    meta_title: '', meta_description: '',
  })
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])
  const [coverImage, setCoverImage] = useState<{file: File, preview: string} | null>(null)
  const [detailImages, setDetailImages] = useState<{file: File, preview: string}[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('id, name, parent_id').eq('is_active', true)
      .order('sort_order').then(({ data }) => setCategories(data || []))
    supabase.from('site_settings').select('usd_exchange_rate').limit(1).single()
      .then(({ data }) => { if (data?.usd_exchange_rate) setUsdRate(Number(data.usd_exchange_rate)) })
  }, [])

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' ? { slug: generateSlug(value) } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const rawPrice = parseFloat(form.price) || 0
    const tlPrice = priceCurrency === 'USD' ? parseFloat((rawPrice * usdRate).toFixed(2)) : rawPrice
    const rawSale = form.sale_price ? parseFloat(form.sale_price) : null
    const tlSale = rawSale !== null ? (priceCurrency === 'USD' ? parseFloat((rawSale * usdRate).toFixed(2)) : rawSale) : null

    const { data, error: insertError } = await supabase.from('products').insert([{
      name: form.name,
      slug: form.slug,
      brand: form.brand || null,
      category_id: form.category_id || null,
      sku: form.sku || null,
      price: tlPrice,
      price_usd: priceCurrency === 'USD' ? rawPrice : null,
      price_currency: priceCurrency,
      sale_price: tlSale,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      dealer_price: form.dealer_price ? parseFloat(form.dealer_price) : null,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      short_description: form.short_description || null,
      description: form.description || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      technical_specs: specs.length > 0 ? specs : null,
    }]).select('id').single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    const productId = data.id

    // Görselleri Yükle
    const allImages = [
      ...(coverImage ? [{ file: coverImage.file, is_cover: true }] : []),
      ...detailImages.map(img => ({ file: img.file, is_cover: false })),
    ]
    if (allImages.length > 0) {
      setUploadingImages(true)
      for (let i = 0; i < allImages.length; i++) {
        const item = allImages[i]
        const fileName = `${productId}_${Date.now()}_${i}.webp`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, item.file)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath)
          await supabase.from('product_images').insert([{
            product_id: productId,
            url: publicUrl,
            sort_order: i,
            is_cover: item.is_cover
          }])
        } else {
          console.error("Storage upload error:", uploadError)
          alert("Ürün görselleri yüklenemedi! Supabase'de 'product-images' bucket'ı kontrol edin.")
        }
      }
    }

    router.push('/admin/urunler')
  }

  async function handleCoverImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const webpFile = await convertToWebP(file, 800, 0.88)
    setCoverImage({ file: webpFile, preview: URL.createObjectURL(webpFile) })
  }

  async function handleDetailImagesAdd(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const newImages = [...detailImages]
    for (let i = 0; i < e.target.files.length; i++) {
      const webpFile = await convertToWebP(e.target.files[i], 1200, 0.85)
      newImages.push({ file: webpFile, preview: URL.createObjectURL(webpFile) })
    }
    setDetailImages(newImages)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/urunler" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Yeni Ürün Ekle</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Ürün bilgilerini doldurun</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Ürün Görselleri</h2>

          {/* Kapak Görseli */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Kapak Görseli <span className="text-red-500">*</span></p>
                <p className="text-xs text-neutral-400">800 × 800 px · Kare · Beyaz/açık arka plan</p>
              </div>
              <label className="btn btn-sm btn-outline cursor-pointer">
                <Upload className="w-4 h-4" /> {coverImage ? 'Değiştir' : 'Görsel Seç'}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageAdd} />
              </label>
            </div>
            {coverImage ? (
              <div className="relative w-40 aspect-square rounded-xl overflow-hidden border-2 border-primary-500 shadow-md">
                <img src={coverImage.preview} alt="Kapak" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverImage(null)}
                  className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-[10px] font-bold text-center py-0.5">KAPAK</div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 aspect-square border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Upload className="w-6 h-6 text-neutral-300 mb-1" />
                <span className="text-xs text-neutral-400">800 × 800</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageAdd} />
              </label>
            )}
          </div>

          <div className="border-t border-neutral-100" />

          {/* Detay Görselleri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Detay Görselleri</p>
                <p className="text-xs text-neutral-400">1200 × 900 px · 4:3 oran · Birden fazla eklenebilir</p>
              </div>
              <label className="btn btn-sm btn-outline cursor-pointer">
                <Upload className="w-4 h-4" /> Görsel Ekle
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleDetailImagesAdd} />
              </label>
            </div>
            {detailImages.length === 0 ? (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 cursor-pointer hover:border-neutral-300 hover:bg-neutral-100 transition-colors">
                <Upload className="w-5 h-5 text-neutral-300 mb-1" />
                <span className="text-xs text-neutral-400">1200 × 900 px · PNG, JPG, WEBP</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleDetailImagesAdd} />
              </label>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {detailImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-neutral-200">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setDetailImages(detailImages.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-300 hover:bg-neutral-50 transition-colors">
                  <Plus className="w-5 h-5 text-neutral-300" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleDetailImagesAdd} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Temel Bilgiler</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Ürün Adı *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className="input" placeholder="Ürün adı" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">URL Slug</label>
              <input type="text" name="slug" value={form.slug} onChange={handleChange} className="input font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Marka</label>
              <input type="text" name="brand" value={form.brand} onChange={handleChange} className="input" placeholder="Marka adı" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Kategori</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className="input">
                <option value="">Kategori seçin</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">SKU</label>
              <input type="text" name="sku" value={form.sku} onChange={handleChange} className="input" placeholder="Stok kodu" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Kısa Açıklama</label>
              <input type="text" name="short_description" value={form.short_description} onChange={handleChange} className="input" placeholder="Ürünün kısa tanımı" />
            </div>
            <div className="sm:col-span-2 space-y-1.5 editor-container">
              <label className="text-sm font-medium text-neutral-700">Detaylı Açıklama</label>
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <ReactQuill 
                  theme="snow" 
                  value={form.description} 
                  onChange={(content: string) => setForm({...form, description: content})} 
                  className="min-h-[200px]"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'clean']
                    ]
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-neutral-900">Fiyat & Stok Yönetimi</h2>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              <button type="button" onClick={() => setPriceCurrency('TRY')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${priceCurrency === 'TRY' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>
                ₺ TL
              </button>
              <button type="button" onClick={() => setPriceCurrency('USD')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${priceCurrency === 'USD' ? 'bg-white shadow text-green-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                $ USD
              </button>
            </div>
          </div>
          {priceCurrency === 'USD' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <span className="font-bold">Kur: $1 = ₺{usdRate.toFixed(2)}</span>
              <span className="text-blue-500">— Fiyatlar dolar olarak girilir, sitede otomatik TL'ye çevrilir.</span>
            </div>
          )}
          
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Maliyet */}
            <div className="space-y-2 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <label className="text-sm font-bold text-neutral-800">Maliyet (Alış) Fiyatı (₺)</label>
              <input type="number" name="cost_price" value={form.cost_price} onChange={handleChange} className="input bg-white" placeholder="0.00" min="0" step="0.01" />
              <p className="text-[11px] text-neutral-500 font-medium">Satış ve Bayi kâr oranları hesaplanırken temel alınır.</p>
            </div>

            {/* Stok */}
            <div className="space-y-2 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <label className="text-sm font-bold text-neutral-800">Stok Miktarı *</label>
              <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} required className="input bg-white" placeholder="0" min="0" />
            </div>

            {/* Satış Fiyatı */}
            <div className="space-y-2 p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <label className="text-sm font-bold text-primary-700">Satış Fiyatı ({priceCurrency === 'USD' ? '$' : '₺'}) *{priceCurrency === 'USD' && form.price ? <span className="ml-2 text-xs font-normal text-neutral-400">≈ ₺{(parseFloat(form.price) * usdRate).toFixed(2)}</span> : null}</label>
              <div className="flex gap-2">
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-1/3">
                  <span className="px-2 flex items-center bg-neutral-100 text-neutral-500 text-xs font-bold border-r border-neutral-200 whitespace-nowrap">+%</span>
                  <input type="number" className="flex-1 px-2 py-2 text-sm outline-none min-w-0 appearance-none" placeholder="Kâr"
                        onChange={(e) => {
                          const cost = parseFloat(form.cost_price) || 0;
                          const margin = parseFloat(e.target.value);
                          if (!isNaN(margin) && cost > 0) {
                            setForm(p => ({ ...p, price: (cost + (cost * margin / 100)).toFixed(2) }))
                          }
                        }}
                  />
                </div>
                <input type="number" name="price" value={form.price} onChange={handleChange} required className="input flex-1 border-primary-300 focus:border-primary-500" placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>

            {/* Bayi Fiyatı */}
            <div className="space-y-2 p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <label className="text-sm font-bold text-blue-700">Bayi Fiyatı ({priceCurrency === 'USD' ? '$' : '₺'}){priceCurrency === 'USD' && form.dealer_price ? <span className="ml-2 text-xs font-normal text-neutral-400">≈ ₺{(parseFloat(form.dealer_price) * usdRate).toFixed(2)}</span> : null}</label>
              <div className="flex gap-2">
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-1/3">
                  <span className="px-2 flex items-center bg-neutral-100 text-neutral-500 text-xs font-bold border-r border-neutral-200 whitespace-nowrap">+%</span>
                  <input type="number" className="flex-1 px-2 py-2 text-sm outline-none min-w-0 appearance-none" placeholder="Kâr"
                        onChange={(e) => {
                          const cost = parseFloat(form.cost_price) || 0;
                          const margin = parseFloat(e.target.value);
                          if (!isNaN(margin) && cost > 0) {
                            setForm(p => ({ ...p, dealer_price: (cost + (cost * margin / 100)).toFixed(2) }))
                          }
                        }}
                  />
                </div>
                <input type="number" name="dealer_price" value={form.dealer_price} onChange={handleChange} className="input flex-1 border-blue-200 focus:border-blue-500" placeholder="Opsiyonel" min="0" step="0.01" />
              </div>
            </div>

            {/* İndirimli Fiyat */}
            <div className="space-y-2 p-4 bg-red-50 rounded-xl border border-red-100 sm:col-span-2">
              <label className="text-sm font-bold text-red-700">Müşteriye Gösterilecek İndirimli Fiyat (₺)</label>
              <div className="flex gap-2">
                <div className="flex rounded-lg border border-red-200 overflow-hidden w-1/4">
                  <span className="px-2 flex items-center bg-red-100 text-red-500 text-xs font-bold border-r border-red-200 whitespace-nowrap">-%</span>
                  <input type="number" className="flex-1 px-2 py-2 text-sm outline-none min-w-0 appearance-none bg-white" placeholder="İndirim"
                        onChange={(e) => {
                          const price = parseFloat(form.price) || 0;
                          const discount = parseFloat(e.target.value);
                          if (!isNaN(discount) && price > 0) {
                            setForm(p => ({
                              ...p,
                              sale_price: (price - (price * discount / 100)).toFixed(2),
                              discount_percent: discount.toString()
                            }))
                          }
                        }}
                  />
                </div>
                <input type="number" name="sale_price" value={form.sale_price} onChange={(e) => {
                  handleChange(e);
                  // Update discount percent automatically if manual price is entered
                  const price = parseFloat(form.price) || 0;
                  const sale = parseFloat(e.target.value);
                  if (!isNaN(sale) && price > 0) {
                     setForm(p => ({ ...p, discount_percent: Math.round(((price - sale) / price) * 100).toString() }))
                  }
                }} className="input bg-white flex-1 border-red-200 focus:border-red-500" placeholder="Tüketiciye yansıyan kampanyalı fiyat (Opsiyonel)" min="0" step="0.01" />
              </div>
              <p className="text-[11px] text-red-600 font-medium mt-1">İndirim yüzdesini girdiğinizde fiyat otomatik hesaplanır; veya fiyatı girerseniz yüzde otomatik kaydedilir.</p>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Teknik Özellikler</h2>
            <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="btn btn-sm btn-outline">
              <Plus className="w-3.5 h-3.5" /> Ekle
            </button>
          </div>
          {specs.length === 0 && <p className="text-sm text-neutral-400">Henüz teknik özellik eklenmedi.</p>}
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text" placeholder="Özellik adı" value={spec.key}
                onChange={e => { const s = [...specs]; s[i].key = e.target.value; setSpecs(s) }}
                className="input flex-1"
              />
              <input
                type="text" placeholder="Değer" value={spec.value}
                onChange={e => { const s = [...specs]; s[i].value = e.target.value; setSpecs(s) }}
                className="input flex-1"
              />
              <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Toggles & SEO */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Durum & SEO</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-neutral-700">Aktif (Sitede görünsün)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-neutral-700">Öne Çıkan Ürün</span>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Meta Başlık</label>
              <input type="text" name="meta_title" value={form.meta_title} onChange={handleChange} className="input" placeholder="SEO başlığı" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Meta Açıklama</label>
              <input type="text" name="meta_description" value={form.meta_description} onChange={handleChange} className="input" placeholder="SEO açıklaması" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/urunler" className="btn btn-ghost">İptal</Link>
          <button type="submit" disabled={saving || uploadingImages} className="btn btn-primary btn-lg">
            {saving || uploadingImages ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadingImages ? 'Görseller Yükleniyor...' : 'Kaydediliyor...'}</> : <><Save className="w-4 h-4" /> Ürünü Kaydet</>}
          </button>
        </div>
      </form>
    </div>
  )
}
