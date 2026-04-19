'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, FileText, Globe } from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false, 
  loading: () => <div className="h-[400px] skeleton rounded-xl" /> 
})
import 'react-quill-new/dist/quill.snow.css'

export default function AdminPages() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    title: '', slug: '', meta_title: '', meta_description: '',
    content: ''
  })

  async function fetchPages() {
    setLoading(true)
    const { data } = await supabase.from('static_pages').select('*').order('title')
    if (data) setPages(data)
    setLoading(false)
  }

  useEffect(() => { fetchPages() }, [])

  function handleAdd() {
    setEditingId('new')
    setForm({ title: '', slug: '', meta_title: '', meta_description: '', content: '' })
  }

  function handleEdit(page: any) {
    setEditingId(page.id)
    setForm({
      title: page.title, slug: page.slug,
      meta_title: page.meta_title || '', meta_description: page.meta_description || '',
      content: typeof page.content === 'object' ? JSON.stringify(page.content, null, 2) : (page.content || '')
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Sayfayı silmek istediğinizden emin misiniz?')) return
    await supabase.from('static_pages').delete().eq('id', id)
    fetchPages()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Attempt parsing JSON if needed, otherwise treat as simple HTML/Text string.
    let parsedContent = form.content
    try { parsedContent = JSON.parse(form.content) } catch(e) {}

    const payload = {
      title: form.title, slug: form.slug,
      meta_title: form.meta_title || null, meta_description: form.meta_description || null,
      content: parsedContent
    }

    if (editingId === 'new') {
      await supabase.from('static_pages').insert([payload])
    } else if (editingId) {
      await supabase.from('static_pages').update(payload).eq('id', editingId)
    }
    
    setEditingId(null)
    fetchPages()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Statik Sayfalar</h1>
          <p className="text-sm text-neutral-500 mt-1">Hakkımızda, Gizlilik, KVKK gibi sayfaları yönetin</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Sayfa
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
             <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider"><th className="text-left py-3 px-4">Sayfa Listesi</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? [...Array(4)].map((_, i) => <tr key={i}><td className="p-4"><div className="h-10 skeleton rounded" /></td></tr>)
                  : pages.length === 0 ? <tr><td className="p-8 text-center text-neutral-400">Sayfa bulunamadı</td></tr>
                  : pages.map(page => (
                    <tr 
                      key={page.id} 
                      className={`hover:bg-neutral-50 transition-colors cursor-pointer ${editingId === page.id ? 'bg-primary-50' : ''}`}
                    >
                      <td className="p-0">
                        <div className="flex items-center justify-between p-4 group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center shrink-0">
                               <FileText className="w-4 h-4 text-neutral-500" />
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900">{page.title}</p>
                              <a href={`/${page.slug}`} target="_blank" className="text-xs text-primary-600 font-mono flex items-center gap-1 hover:underline"><Globe className="w-3 h-3"/> /{page.slug}</a>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(page)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md"><Pencil className="w-4 h-4" /></button>
                            {page.slug !== 'hakkimizda' && <button onClick={() => handleDelete(page.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
        </div>

        {/* Form Modal/Sidebar */}
        {editingId ? (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 sticky top-24 overflow-hidden">
             <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
               <h2 className="font-bold text-neutral-900">{editingId === 'new' ? 'Yeni Sayfa' : 'Sayfa Düzenle'}</h2>
               <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-4 h-4" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-5 space-y-5">
               <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">Sayfa Başlığı *</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input text-sm" /></div>
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">URL Slug *</label><input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required className="input text-sm font-mono" placeholder="gizlilik-politikasi" /></div>
               </div>
               
               <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">SEO Meta Title</label><input type="text" value={form.meta_title} onChange={e => setForm({...form, meta_title: e.target.value})} className="input text-sm" /></div>
                 <div className="space-y-1.5"><label className="text-sm font-medium text-neutral-700">SEO Meta Description</label><input type="text" value={form.meta_description} onChange={e => setForm({...form, meta_description: e.target.value})} className="input text-sm" /></div>
               </div>

               <div className="space-y-1.5 editor-container">
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-medium text-neutral-700">Sayfa İçeriği</label>
                 </div>
                 <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                   <ReactQuill 
                     theme="snow" 
                     value={form.content} 
                     onChange={(content: string) => setForm({...form, content})} 
                     className="min-h-[400px]"
                     modules={{
                       toolbar: [
                         [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                         ['bold', 'italic', 'underline', 'strike'],
                         [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                         ['link', 'image', 'video'],
                         ['clean']
                       ]
                     }}
                   />
                 </div>
                 <p className="text-xs text-neutral-500 mt-2">Not: Zengin metin editörü (Rich Text) veya geçerli JSON kullanılabilir.</p>
               </div>

               <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                 <button type="submit" className="btn btn-primary shadow-md px-8"><Save className="w-4 h-4" /> Değişiklikleri Kaydet</button>
               </div>
             </form>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed flex items-center justify-center p-8 text-center text-neutral-400 h-[600px] sticky top-24">
            <div>
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Düzenlemek için sol taraftan bir sayfa seçin veya yeni sayfa ekleyin.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
