'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X, Upload, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
  const [form, setForm] = useState({
    name: '', slug: '', brand: '', category_id: '', sku: '',
    price: '', sale_price: '', cost_price: '', dealer_price: '',
    discount_percent: '', stock_quantity: '0',
    short_description: '', description: '',
    is_active: true, is_featured: false,
    meta_title: '', meta_description: '',
  })
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])
  const [images, setImages] = useState<{file: File, preview: string, is_cover: boolean}[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('id, name, parent_id').eq('is_active', true)
      .order('sort_order').then(({ data }) => setCategories(data || []))
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

    const { data, error: insertError } = await supabase.from('products').insert([{
      name: form.name,
      slug: form.slug,
      brand: form.brand || null,
      category_id: form.category_id || null,
      sku: form.sku || null,
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
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
    if (images.length > 0) {
      setUploadingImages(true)
      for (let i = 0; i < images.length; i++) {
        const item = images[i]
        const fileExt = 'webp'
        const fileName = `${productId}_${Date.now()}_${i}.${fileExt}`
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
          alert("Ürün görselleri yüklenemedi! Lütfen Supabase'de 'product_images' bucket'ının oluşturulduğundan ve PUBLIC erişime (Insert dâhil) açık olduğundan emin olun.")
        }
      }
    }

    router.push('/admin/urunler')
  }

  async function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    
    const newImages = [...images]
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        const webpFile = await convertToWebP(file, 1200, 0.85) // Convert to webp locally
        newImages.push({
            file: webpFile as any, // File or Blob is fine for supabase upload
            preview: URL.createObjectURL(webpFile),
            is_cover: newImages.length === 0, // First image is cover by default
        })
    }
    setImages(newImages)
  }

  function setCoverImage(index: number) {
      setImages(images.map((img, i) => ({ ...img, is_cover: i === index })))
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Ürün Görselleri</h2>
            <label className="btn btn-sm btn-outline cursor-pointer">
              <Upload className="w-4 h-4" /> Görsel Ekle
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </label>
          </div>
          
          {images.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50/50">
              <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500 font-medium">Görsel seçmek için tıklayın veya sürükleyin</p>
              <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP (Otomatik optimize edilir)</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${img.is_cover ? 'border-primary-500 shadow-md' : 'border-neutral-200'}`}>
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {!img.is_cover && (
                      <button type="button" onClick={() => setCoverImage(idx)} className="btn btn-sm bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm text-xs">Kapak Yap</button>
                    )}
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="btn btn-sm bg-red-500/80 hover:bg-red-500 text-white border-0 backdrop-blur-sm text-xs">Sil</button>
                  </div>
                  {img.is_cover && <div className="absolute top-2 left-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">KAPAK</div>}
                </div>
              ))}
            </div>
          )}
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
          </div>
          
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
              <label className="text-sm font-bold text-primary-700">Satış Fiyatı (₺) *</label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">+%</span>
                  <input type="number" className="input pl-8" placeholder="Kâr" 
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
              <label className="text-sm font-bold text-blue-700">Bayi Fiyatı (₺)</label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">+%</span>
                  <input type="number" className="input pl-8" placeholder="Kâr" 
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
                <div className="relative w-1/4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">-%</span>
                  <input type="number" className="input pl-8 bg-white border-red-200 focus:border-red-500" placeholder="İndirim" 
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
