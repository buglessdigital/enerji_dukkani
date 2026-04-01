'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, Network, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parent_id: '',
    description: '',
    sort_order: '0',
    is_active: true
  })

  async function fetchCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (data) {
      // Create hierarchy for display
      const roots = data.filter(c => !c.parent_id)
      roots.forEach(r => {
        r.children = data.filter(c => c.parent_id === r.id).sort((a,b) => a.sort_order - b.sort_order)
      })
      setCategories(roots)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
  }

  function handleAdd() {
    setEditingId('new')
    setForm({ name: '', slug: '', parent_id: '', description: '', sort_order: '0', is_active: true })
  }

  function handleEdit(cat: any) {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || '',
      description: cat.description || '',
      sort_order: cat.sort_order?.toString() || '0',
      is_active: cat.is_active
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      slug: form.slug,
      parent_id: form.parent_id || null,
      description: form.description || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active
    }

    if (editingId === 'new') {
      await supabase.from('categories').insert([payload])
    } else if (editingId) {
      await supabase.from('categories').update(payload).eq('id', editingId)
    }
    
    setEditingId(null)
    fetchCategories()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-heading">Kategori Yönetimi</h1>
          <p className="text-sm text-neutral-500 mt-1">Sitenizin kategori ağacını düzenleyin</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Yeni Kategori
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Categories List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden p-2">
          {loading ? (
            <div className="p-8 text-center text-neutral-400">Yükleniyor...</div>
          ) : categories.length === 0 ? (
            <div className="p-16 text-center text-neutral-400">
              <Network className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Henüz kategori eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map(cat => (
                <div key={cat.id}>
                  {/* Root Category */}
                  <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-xl group transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                        {cat.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{cat.name}</span>
                          {!cat.is_active && <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Pasif</span>}
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">/{cat.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(cat)} className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  {/* Subcategories */}
                  {cat.children?.length > 0 && (
                    <div className="ml-6 pl-2 mt-1 mb-2 border-l-2 border-neutral-100 space-y-1">
                      {cat.children.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-xl group transition-colors">
                          <div className="flex items-center gap-3 pl-2">
                             <div>
                               <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-700">{child.name}</span>
                                {!child.is_active && <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Pasif</span>}
                               </div>
                               <span className="text-xs text-neutral-400 font-mono">/{cat.slug}/{child.slug}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(child)} className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(child.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal/Sidebar */}
        {editingId && (
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-neutral-100 sticky top-24 overflow-hidden">
             <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
               <h2 className="font-bold text-neutral-900">{editingId === 'new' ? 'Yeni Kategori' : 'Düzenle'}</h2>
               <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-4 h-4" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-5 space-y-4">
               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-neutral-700">Kategori Adı *</label>
                 <input type="text" value={form.name} onChange={e => {
                   setForm({...form, name: e.target.value, slug: form.slug || generateSlug(e.target.value) })
                 }} required className="input text-sm" />
               </div>
               
               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-neutral-700">URL Slug *</label>
                 <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required className="input text-sm font-mono bg-neutral-50" />
               </div>

               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-neutral-700">Üst Kategori</label>
                 <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})} className="input text-sm">
                   <option value="">(Ana Kategori)</option>
                   {categories.filter(c => c.id !== editingId).map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>

               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-neutral-700">Sıra No</label>
                 <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} className="input text-sm" />
               </div>

               <label className="flex items-center gap-2 cursor-pointer mt-2">
                 <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded border-neutral-300 text-primary-600" />
                 <span className="text-sm font-medium text-neutral-700">Aktif</span>
               </label>

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
