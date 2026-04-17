'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, ImageIcon, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { convertToWebP } from '@/lib/imageUtils'

export default function AdminSlider() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '',
    image_url: '', mobile_image_url: '', button_text: '', button_link: '',
    secondary_button_text: '', secondary_button_link: '',
    sort_order: '0', is_active: true
  })
  const [uploadingMobile, setUploadingMobile] = useState(false)

  async function fetchSlides() {
    setLoading(true)
    const { data } = await supabase.from('hero_slides').select('*').order('sort_order', { ascending: true })
    if (data) setSlides(data)
    setLoading(false)
  }

  useEffect(() => { fetchSlides() }, [])

  function handleAdd() {
    setEditingId('new')
    setForm({
      title: '', subtitle: '', description: '',
      image_url: '', mobile_image_url: '', button_text: '', button_link: '',
      secondary_button_text: '', secondary_button_link: '',
      sort_order: '0', is_active: true
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploading(true)
    
    const webpFile = await convertToWebP(file, 1920, 0.85)

    const fileExt = 'webp'
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `hero/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('slider_images')
      .upload(filePath, webpFile)

    if (uploadError) {
      alert('Görsel yüklenirken hata oluştu! Supabase Panelinde "slider_images" adında bir Storage (Bucket) oluşturduğunuzdan ve bu bucketın "Public" olduğundan emin olun. Detay: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('slider_images').getPublicUrl(filePath)
    
    setForm(prev => ({ ...prev, image_url: publicUrl }))
    setUploading(false)
  }

  async function handleMobileImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploadingMobile(true)

    const webpFile = await convertToWebP(file, 900, 0.85)
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.webp`
    const filePath = `hero/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('slider_images')
      .upload(filePath, webpFile)

    if (uploadError) {
      alert('Görsel yüklenirken hata oluştu! ' + uploadError.message)
      setUploadingMobile(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('slider_images').getPublicUrl(filePath)
    setForm(prev => ({ ...prev, mobile_image_url: publicUrl }))
    setUploadingMobile(false)
  }

  function handleEdit(slide: any) {
    setEditingId(slide.id)
    setForm({
      title: slide.title, subtitle: slide.subtitle || '', description: slide.description || '',
      image_url: slide.image_url || '', mobile_image_url: slide.mobile_image_url || '',
      button_text: slide.button_text || '', button_link: slide.button_link || '',
      secondary_button_text: slide.secondary_button_text || '', secondary_button_link: slide.secondary_button_link || '',
      sort_order: slide.sort_order?.toString() || '0', is_active: slide.is_active
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Slaytı silmek istediğinizden emin misiniz?')) return
    await supabase.from('hero_slides').delete().eq('id', id)
    fetchSlides()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title: form.title, subtitle: form.subtitle || null, description: form.description || null,
      image_url: form.image_url || '', mobile_image_url: form.mobile_image_url || null,
      button_text: form.button_text || null, button_link: form.button_link || null,
      secondary_button_text: form.secondary_button_text || null, secondary_button_link: form.secondary_button_link || null,
      sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active
    }

    if (editingId === 'new') {
      await supabase.from('hero_slides').insert([payload])
    } else if (editingId) {
      await supabase.from('hero_slides').update(payload).eq('id', editingId)
    }
    
    setEditingId(null)
    fetchSlides()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Hero Slider Yönetimi</h1>
          <p className="text-sm text-neutral-500 mt-1">Ana sayfadaki büyük kayan görselleri düzenleyin</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Slayt
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto w-full">
             <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider"><th className="text-left py-3 px-4">Görsel / Başlık</th><th className="text-left py-3 px-4">Sıra</th><th className="text-left py-3 px-4">Durum</th><th className="text-right py-3 px-4">İşlemler</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={4} className="p-4"><div className="h-10 skeleton rounded" /></td></tr>)
                  : slides.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-neutral-400">Slayt bulunamadı</td></tr>
                  : slides.map(slide => (
                    <tr key={slide.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-neutral-200 rounded overflow-hidden shrink-0">
                            {slide.image_url ? <img src={slide.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 opacity-30" /></div>}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 line-clamp-1">{slide.title}</p>
                            {slide.subtitle && <p className="text-xs text-neutral-500 line-clamp-1">{slide.subtitle}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{slide.sort_order}</td>
                      <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>{slide.is_active ? 'Aktif' : 'Pasif'}</span></td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleEdit(slide)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(slide.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Form Modal/Sidebar */}
        {editingId && (
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-neutral-100 sticky top-24 overflow-hidden">
             <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
               <h2 className="font-bold text-neutral-900">{editingId === 'new' ? 'Yeni Slayt' : 'Slayt Düzenle'}</h2>
               <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-4 h-4" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-5 space-y-4">

               {/* Desktop image */}
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-neutral-700">Masaüstü Görseli *</label>
                    <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Önerilen: 1920x600px</span>
                  </div>
                  {form.image_url && (
                    <div className="w-full h-28 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                    {uploading && <p className="text-xs text-primary-600">Yükleniyor...</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">Veya URL:</span>
                      <input type="url" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} required className="input text-sm flex-1" placeholder="https://..." />
                    </div>
                  </div>
               </div>

               {/* Mobile image */}
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-neutral-700">Mobil Görseli *</label>
                    <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Önerilen: 900x1080px</span>
                  </div>
                  {form.mobile_image_url && (
                    <div className="w-full h-28 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 relative">
                      <img src={form.mobile_image_url} alt="Mobil Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, mobile_image_url: '' }))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-neutral-500 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" onChange={handleMobileImageUpload} disabled={uploadingMobile} className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                    {uploadingMobile && <p className="text-xs text-primary-600">Yükleniyor...</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">Veya URL:</span>
                      <input type="url" value={form.mobile_image_url} onChange={e => setForm({...form, mobile_image_url: e.target.value})} required className="input text-sm flex-1" placeholder="https://..." />
                    </div>
                  </div>
               </div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Başlık *</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input text-sm" /></div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Alt Başlık (Rozet)</label><input type="text" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="input text-sm" /></div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Açıklama</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="input text-sm resize-none" /></div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Buton 1 Yazi</label><input type="text" value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} className="input text-sm" /></div>
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Buton 1 Link</label><input type="text" value={form.button_link} onChange={e => setForm({...form, button_link: e.target.value})} className="input text-sm" /></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Buton 2 Yazi</label><input type="text" value={form.secondary_button_text} onChange={e => setForm({...form, secondary_button_text: e.target.value})} className="input text-sm" /></div>
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Buton 2 Link</label><input type="text" value={form.secondary_button_link} onChange={e => setForm({...form, secondary_button_link: e.target.value})} className="input text-sm" /></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Sıra</label><input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} className="input text-sm" /></div>
                <label className="flex items-end pb-2 gap-2 cursor-pointer mt-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded border-neutral-300 text-primary-600 mb-0.5" /><span className="text-sm font-medium text-neutral-700">Aktif Slayt</span></label>
               </div>

               <div className="pt-4 border-t border-neutral-100 flex justify-end">
                 <button type="submit" className="btn btn-primary w-full shadow-md"><Save className="w-4 h-4" /> Kaydet</button>
               </div>
             </form>
          </div>
        )}

      </div>
    </div>
  )
}
