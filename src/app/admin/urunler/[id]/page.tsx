'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X, Loader2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
  const [images, setImages] = useState<{file: File, preview: string, is_cover: boolean}[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetch() {
      const [{ data: cats }, { data: product }, { data: imgs }] = await Promise.all([
        supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_images').select('*').eq('product_id', id).order('sort_order')
      ])
      setCategories(cats || [])
      setExistingImages(imgs || [])
      if (product) {
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
    const { error: updateError } = await supabase.from('products').update({
      name: form.name, slug: form.slug, brand: form.brand || null,
      category_id: form.category_id || null, sku: form.sku || null,
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
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
    if (images.length > 0) {
      setUploadingImages(true)
      for (let i = 0; i < images.length; i++) {
        const item = images[i]
        const fileExt = 'webp'
        const fileName = `${id}_${Date.now()}_${i}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, item.file)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath)
          
          await supabase.from('product_images').insert([{
            product_id: id,
            url: publicUrl,
            sort_order: existingImages.length + i,
            is_cover: existingImages.length === 0 && i === 0 && item.is_cover
          }])
        } else {
          console.error("Storage upload error:", uploadError)
          alert("Ürün görselleri yüklenemedi! Lütfen Supabase'de 'product-images' bucket'ının oluşturulduğundan ve PUBLIC erişime (Insert dâhil) açık olduğundan emin olun.")
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
        const webpFile = await convertToWebP(file, 1200, 0.85)
        newImages.push({
            file: webpFile as any,
            preview: URL.createObjectURL(webpFile),
            is_cover: existingImages.length === 0 && newImages.length === 0,
        })
    }
    setImages(newImages)
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Ürün Görselleri</h2>
            <label className="btn btn-sm btn-outline cursor-pointer">
              <Upload className="w-4 h-4" /> Görsel Ekle
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </label>
          </div>
          
          {(existingImages.length === 0 && images.length === 0) ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50/50">
              <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500 font-medium">Görsel seçmek için tıklayın veya sürükleyin</p>
              <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP (Otomatik optimize edilir)</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Mevcut Görseller */}
              {existingImages.map((img) => (
                <div key={img.id} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${img.is_cover ? 'border-primary-500 shadow-md' : 'border-neutral-200'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {!img.is_cover && (
                      <button type="button" onClick={() => handleSetExistingCover(img.id)} className="btn btn-sm bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm text-xs">Kapak Yap</button>
                    )}
                    <button type="button" onClick={() => handleDeleteExistingImage(img.id, img.url)} className="btn btn-sm bg-red-500/80 hover:bg-red-500 text-white border-0 backdrop-blur-sm text-xs">Sil</button>
                  </div>
                  {img.is_cover && <div className="absolute top-2 left-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">KAPAK</div>}
                </div>
              ))}

              {/* Yeni Yüklenecek Görseller */}
              {images.map((img, idx) => (
                <div key={`new-${idx}`} className={`relative aspect-square rounded-xl overflow-hidden border-2 border-primary-300 border-dashed opacity-80`}>
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="btn btn-sm bg-red-500/80 hover:bg-red-500 text-white border-0 backdrop-blur-sm text-xs">İptal</button>
                  </div>
                  <div className="absolute top-2 left-2 bg-primary-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/>Yeni</div>
                </div>
              ))}
            </div>
          )}
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
