'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, ImageIcon } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { convertToWebP } from '@/lib/imageUtils'

export default function AdminCollections() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const GRADIENTS = [
    { label: 'Mavi', value: 'from-blue-600 to-blue-800' },
    { label: 'Yeşil', value: 'from-emerald-600 to-emerald-800' },
    { label: 'Sarı', value: 'from-amber-600 to-amber-800' },
    { label: 'Mor', value: 'from-violet-600 to-violet-800' },
    { label: 'Pembe', value: 'from-rose-600 to-rose-800' },
    { label: 'Turkuaz', value: 'from-cyan-600 to-cyan-800' },
    { label: 'Turuncu', value: 'from-orange-600 to-orange-800' },
    { label: 'Kırmızı', value: 'from-red-600 to-red-800' },
    { label: 'Lacivert', value: 'from-indigo-600 to-indigo-800' },
    { label: 'Gri', value: 'from-slate-600 to-slate-800' },
  ]

  const [form, setForm] = useState({
    title: '', subtitle: '', hover_text: '',
    image_url: '', target_url: '',
    gradient_color: 'from-blue-600 to-blue-800',
    sort_order: '0', is_active: true
  })

  async function fetchCollections() {
    setLoading(true)
    const { data } = await supabase.from('collections').select('*').order('sort_order', { ascending: true })
    if (data) setCollections(data)
    setLoading(false)
  }

  useEffect(() => { fetchCollections() }, [])

  function handleAdd() {
    setEditingId('new')
    setForm({ title: '', subtitle: '', hover_text: '', image_url: '', target_url: '', gradient_color: 'from-blue-600 to-blue-800', sort_order: '0', is_active: true })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploading(true)
    
    const webpFile = await convertToWebP(file, 800, 0.85)

    const fileExt = 'webp'
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `collections/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('slider_images')
      .upload(filePath, webpFile)

    if (uploadError) {
      alert('Görsel yüklenirken hata oluştu! "slider_images" bucketının açık olduğundan emin olun. Hata: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('slider_images').getPublicUrl(filePath)
    
    setForm({ ...form, image_url: publicUrl })
    setUploading(false)
  }

  function handleEdit(col: any) {
    setEditingId(col.id)
    setForm({
      title: col.title, subtitle: col.subtitle || '', hover_text: col.hover_text || '',
      image_url: col.image_url || '', target_url: col.target_url || '',
      gradient_color: col.gradient_color || 'from-blue-600 to-blue-800',
      sort_order: col.sort_order?.toString() || '0', is_active: col.is_active
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Koleksiyonu silmek istediğinizden emin misiniz?')) return
    await supabase.from('collections').delete().eq('id', id)
    fetchCollections()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title: form.title, subtitle: form.subtitle || null, hover_text: form.hover_text || null,
      image_url: form.image_url || '', target_url: form.target_url || '',
      gradient_color: form.gradient_color || 'from-blue-600 to-blue-800',
      sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active
    }

    if (editingId === 'new') {
      await supabase.from('collections').insert([payload])
    } else if (editingId) {
      await supabase.from('collections').update(payload).eq('id', editingId)
    }
    
    setEditingId(null)
    fetchCollections()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Koleksiyon Yönetimi</h1>
          <p className="text-sm text-neutral-500 mt-1">Ana sayfadaki koleksiyon kartlarını yönetin</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Koleksiyon
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto w-full">
             <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider"><th className="text-left py-3 px-4">Görsel / Başlık</th><th className="text-left py-3 px-4">Link</th><th className="text-left py-3 px-4">Sıra / Durum</th><th className="text-right py-3 px-4">İşlemler</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={4} className="p-4"><div className="h-10 skeleton rounded" /></td></tr>)
                  : collections.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-neutral-400">Koleksiyon bulunamadı</td></tr>
                  : collections.map(col => (
                    <tr key={col.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-neutral-200 rounded-lg overflow-hidden shrink-0">
                            {col.image_url ? <img src={col.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 opacity-30" /></div>}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 line-clamp-1">{col.title}</p>
                            {col.subtitle && <p className="text-xs text-neutral-500 line-clamp-1">{col.subtitle}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-neutral-500 truncate max-w-[150px]">{col.target_url}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-xs">Sıra: <b>{col.sort_order}</b></div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${col.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>{col.is_active ? 'Aktif' : 'Pasif'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleEdit(col)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(col.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md ml-1"><Trash2 className="w-4 h-4" /></button>
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
               <h2 className="font-bold text-neutral-900">{editingId === 'new' ? 'Yeni Koleksiyon' : 'Koleksiyon Düzenle'}</h2>
               <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-4 h-4" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-5 space-y-4">
               {form.image_url && (
                  <div className="w-full h-32 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 mb-2">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
               )}
               <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Görsel *</label>
                  <div className="flex flex-col gap-2">
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                    {uploading && <p className="text-xs text-primary-600">Yükleniyor...</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">URL:</span>
                      <input type="url" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} required className="input text-sm flex-1" placeholder="https://..." />
                    </div>
                  </div>
               </div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Başlık *</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input text-sm" /></div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Alt Başlık</label><input type="text" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="input text-sm" /></div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Hover Açıklaması</label><textarea value={form.hover_text} onChange={e => setForm({...form, hover_text: e.target.value})} rows={2} className="input text-sm resize-none" placeholder="Üzerine gelince çıkacak yazı" /></div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-neutral-700">Görsel Yoksa Gradient Rengi</label>
                 <div className="grid grid-cols-5 gap-2">
                   {GRADIENTS.map(g => (
                     <button
                       key={g.value}
                       type="button"
                       title={g.label}
                       onClick={() => setForm({...form, gradient_color: g.value})}
                       className={`h-8 rounded-lg bg-gradient-to-br ${g.value} transition-all ${form.gradient_color === g.value ? 'ring-2 ring-offset-2 ring-neutral-800 scale-110' : 'opacity-70 hover:opacity-100'}`}
                     />
                   ))}
                 </div>
               </div>
               <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Hedef Link *</label><input type="text" value={form.target_url} onChange={e => setForm({...form, target_url: e.target.value})} required className="input text-sm" placeholder="/kategori/..." /></div>
               
               <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Sıra</label><input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} className="input text-sm" /></div>
                <label className="flex items-end pb-2 gap-2 cursor-pointer mt-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded border-neutral-300 text-primary-600 mb-0.5" /><span className="text-sm font-medium text-neutral-700">Aktif</span></label>
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
