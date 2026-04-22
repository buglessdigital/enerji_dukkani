'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X, Loader2, Upload } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false, 
  loading: () => <div className="h-[200px] skeleton rounded-xl" /> 
})
import 'react-quill-new/dist/quill.snow.css'
import { convertToWebP } from '@/lib/imageUtils'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usdRate, setUsdRate] = useState<number>(35.0)
  const [priceCurrency, setPriceCurrency] = useState<'TRY' | 'USD'>('TRY')
  const [priceMargin, setPriceMargin] = useState('')
  const [dealerMargin, setDealerMargin] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', brand: '', category_id: '', sku: '',
    price: '', sale_price: '', cost_price: '', dealer_price: '',
    discount_percent: '', stock_quantity: '0',
    short_description: '', description: '',
    is_active: true, is_featured: false,
    meta_title: '', meta_description: '',
  })
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [newCoverImage, setNewCoverImage] = useState<{file: File, preview: string} | null>(null)
  const [newDetailImages, setNewDetailImages] = useState<{file: File, preview: string}[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetch() {
      const [{ data: cats }, { data: product }, { data: imgs }, { data: settings }] = await Promise.all([
        supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
        supabase.from('site_settings').select('usd_exchange_rate').limit(1).single(),
      ])
      if (settings?.usd_exchange_rate) setUsdRate(Number(settings.usd_exchange_rate))
      setCategories(cats || [])
      setExistingImages(imgs || [])
      if (product) {
        const costPrice = product.cost_price ? parseFloat(product.cost_price) : 0
        const salePrice = product.price ? parseFloat(product.price) : 0
        const dealerPrice = product.dealer_price ? parseFloat(product.dealer_price) : 0
        if (costPrice > 0 && salePrice > 0) setPriceMargin(((salePrice - costPrice) / costPrice * 100).toFixed(2))
        if (costPrice > 0 && dealerPrice > 0) setDealerMargin(((dealerPrice - costPrice) / costPrice * 100).toFixed(2))
        setForm({
          name: product.name || '', slug: product.slug || '',
          brand: product.brand || '', category_id: product.category_id || '',
          sku: product.sku || '',
          price: product.price?.toString() || '',
          sale_price: product.sale_price?.toString() || '',
          cost_price: product.cost_price?.toString() || '',
          dealer_price: product.dealer_price?.toString() || '',
          discount_percent: product.discount_percent?.toString() || '',
          stock_quantity: product.stock_quantity?.toString() || '0',
          short_description: product.short_description || '',
          description: product.description || '',
          is_active: product.is_active, is_featured: product.is_featured,
          meta_title: product.meta_title || '', meta_description: product.meta_description || '',
        })
        setSpecs(product.technical_specs || [])
        if (product.price_currency === 'USD') {
          setPriceCurrency('USD')
          setForm(prev => ({ ...prev, price: product.price_usd?.toString() || prev.price }))
        }
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const rawPrice = parseFloat(form.price) || 0
    const tlPrice = priceCurrency === 'USD' ? parseFloat((rawPrice * usdRate).toFixed(2)) : rawPrice
    const rawSale = form.sale_price ? parseFloat(form.sale_price) : null
    const tlSale = rawSale !== null ? (priceCurrency === 'USD' ? parseFloat((rawSale * usdRate).toFixed(2)) : rawSale) : null

    const { error: updateError } = await supabase.from('products').update({
      name: form.name, slug: form.slug, brand: form.brand || null,
      category_id: form.category_id || null, sku: form.sku || null,
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
      is_active: form.is_active, is_featured: form.is_featured,
      meta_title: form.meta_title || null, meta_description: form.meta_description || null,
      technical_specs: specs.length > 0 ? specs : null,
    }).eq('id', id)

    if (updateError) { setError(updateError.message); setSaving(false); return }

    // Yeni Görselleri Yükle
    const allNewImages = [
      ...(newCoverImage ? [{ file: newCoverImage.file, is_cover: true }] : []),
      ...newDetailImages.map(img => ({ file: img.file, is_cover: false })),
    ]
    if (allNewImages.length > 0) {
      setUploadingImages(true)
      // If new cover uploaded, demote existing cover
      if (newCoverImage) {
        await supabase.from('product_images').update({ is_cover: false }).eq('product_id', id).eq('is_cover', true)
      }
      for (let i = 0; i < allNewImages.length; i++) {
        const item = allNewImages[i]
        const fileName = `${id}_${Date.now()}_${i}.webp`
        const filePath = `products/${fileName}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, item.file)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath)
          await supabase.from('product_images').insert([{
            product_id: id, url: publicUrl,
            sort_order: existingImages.length + i,
            is_cover: item.is_cover
          }])
        } else {
          console.error("Storage upload error:", uploadError)
          alert("Ürün görselleri yüklenemedi!")
        }
      }
    }

    router.push('/admin/urunler')
  }

  async function handleNewCoverImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const webpFile = await convertToWebP(file, 800, 0.88)
    setNewCoverImage({ file: webpFile, preview: URL.createObjectURL(webpFile) })
  }

  async function handleNewDetailImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const newImages = [...newDetailImages]
    for (let i = 0; i < e.target.files.length; i++) {
      const webpFile = await convertToWebP(e.target.files[i], 1200, 0.85)
      newImages.push({ file: webpFile, preview: URL.createObjectURL(webpFile) })
    }
    setNewDetailImages(newImages)
  }

  async function handleDeleteExistingImage(imgId: string, imgUrl: string) {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return
    
    // Extract file path from URL
    const urlParts = imgUrl.split('/')
    let filePath = ''
    const bucketIndex = urlParts.indexOf('product-images')
    if (bucketIndex !== -1) {
        filePath = urlParts.slice(bucketIndex + 1).join('/')
    }

    if (filePath) {
        await supabase.storage.from('product-images').remove([filePath])
    }
    
    await supabase.from('product_images').delete().eq('id', imgId)
    setExistingImages(existingImages.filter(img => img.id !== imgId))
  }

  async function handleSetExistingCover(imgId: string) {
    // Reset all covers for this product
    await supabase.from('product_images').update({ is_cover: false }).eq('product_id', id)
    // Set new cover
    await supabase.from('product_images').update({ is_cover: true }).eq('id', imgId)
    
    setExistingImages(existingImages.map(img => ({
      ...img,
      is_cover: img.id === imgId
    })))
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-48 skeleton rounded" />
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"><div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-10 skeleton rounded" />)}</div></div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/urunler" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-neutral-600" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Ürünü Düzenle</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{form.name}</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Ürün Görselleri</h2>

          {/* Kapak Görseli */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Kapak Görseli</p>
                <p className="text-xs text-neutral-400">800 × 800 px · Kare · Beyaz/açık arka plan</p>
              </div>
              <label className="btn btn-sm btn-outline cursor-pointer">
                <Upload className="w-4 h-4" /> {newCoverImage || existingImages.some(i => i.is_cover) ? 'Değiştir' : 'Görsel Seç'}
                <input type="file" accept="image/*" className="hidden" onChange={handleNewCoverImage} />
              </label>
            </div>
            <div className="flex gap-3 flex-wrap">
              {/* Mevcut kapak */}
              {!newCoverImage && existingImages.filter(i => i.is_cover).map(img => (
                <div key={img.id} className="relative w-40 aspect-square rounded-xl overflow-hidden border-2 border-primary-500 shadow-md">
                  <img src={img.url} alt="Kapak" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleDeleteExistingImage(img.id, img.url)}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-[10px] font-bold text-center py-0.5">KAPAK</div>
                </div>
              ))}
              {/* Yeni kapak */}
              {newCoverImage && (
                <div className="relative w-40 aspect-square rounded-xl overflow-hidden border-2 border-primary-500 shadow-md">
                  <img src={newCoverImage.preview} alt="Yeni Kapak" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewCoverImage(null)}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-[10px] font-bold text-center py-0.5">YENİ KAPAK</div>
                </div>
              )}
              {!newCoverImage && !existingImages.some(i => i.is_cover) && (
                <label className="flex flex-col items-center justify-center w-40 aspect-square border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <Upload className="w-6 h-6 text-neutral-300 mb-1" />
                  <span className="text-xs text-neutral-400">800 × 800</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleNewCoverImage} />
                </label>
              )}
            </div>
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
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewDetailImages} />
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {/* Mevcut detay görseller */}
              {existingImages.filter(i => !i.is_cover).map(img => (
                <div key={img.id} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-neutral-200">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleDeleteExistingImage(img.id, img.url)}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Yeni detay görseller */}
              {newDetailImages.map((img, idx) => (
                <div key={`new-${idx}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-primary-300 border-dashed">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewDetailImages(newDetailImages.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600">
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-500/80 text-white text-[10px] font-bold text-center py-0.5">YENİ</div>
                </div>
              ))}
              <label className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-300 hover:bg-neutral-50 transition-colors">
                <Plus className="w-5 h-5 text-neutral-300" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewDetailImages} />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Temel Bilgiler</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium text-neutral-700">Ürün Adı *</label><input type="text" name="name" value={form.name} onChange={handleChange} required className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">URL Slug</label><input type="text" name="slug" value={form.slug} onChange={handleChange} className="input font-mono text-xs" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Marka</label><input type="text" name="brand" value={form.brand} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Kategori</label><select name="category_id" value={form.category_id} onChange={handleChange} className="input"><option value="">Seçin</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">SKU</label><input type="text" name="sku" value={form.sku} onChange={handleChange} className="input" /></div>
            <div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium text-neutral-700">Kısa Açıklama</label><input type="text" name="short_description" value={form.short_description} onChange={handleChange} className="input" /></div>
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
                        value={priceMargin}
                        onChange={(e) => {
                          setPriceMargin(e.target.value)
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
                        value={dealerMargin}
                        onChange={(e) => {
                          setDealerMargin(e.target.value)
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
                        value={form.discount_percent}
                        onChange={(e) => {
                          const price = parseFloat(form.price) || 0;
                          const discount = parseFloat(e.target.value);
                          if (!isNaN(discount) && price > 0) {
                            setForm(p => ({
                              ...p,
                              sale_price: (price - (price * discount / 100)).toFixed(2),
                              discount_percent: e.target.value
                            }))
                          } else {
                            setForm(p => ({ ...p, discount_percent: e.target.value }))
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-neutral-900">Teknik Özellikler</h2><button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="btn btn-sm btn-outline"><Plus className="w-3.5 h-3.5" /> Ekle</button></div>
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="text" placeholder="Özellik" value={spec.key} onChange={e => { const s = [...specs]; s[i].key = e.target.value; setSpecs(s) }} className="input flex-1" />
              <input type="text" placeholder="Değer" value={spec.value} onChange={e => { const s = [...specs]; s[i].value = e.target.value; setSpecs(s) }} className="input flex-1" />
              <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-5">
          <h2 className="text-lg font-bold text-neutral-900">Durum & SEO</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded border-neutral-300 text-primary-600" /><span className="text-sm font-medium text-neutral-700">Aktif</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="w-4 h-4 rounded border-neutral-300 text-primary-600" /><span className="text-sm font-medium text-neutral-700">Öne Çıkan</span></label>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Meta Başlık</label><input type="text" name="meta_title" value={form.meta_title} onChange={handleChange} className="input" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Meta Açıklama</label><input type="text" name="meta_description" value={form.meta_description} onChange={handleChange} className="input" /></div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/urunler" className="btn btn-ghost">İptal</Link>
          <button type="submit" disabled={saving || uploadingImages} className="btn btn-primary btn-lg">
            {saving || uploadingImages ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadingImages ? 'Görseller Yükleniyor...' : 'Güncelleniyor...'}</> : <><Save className="w-4 h-4" /> Güncelle</>}
          </button>
        </div>
      </form>
    </div>
  )
}
