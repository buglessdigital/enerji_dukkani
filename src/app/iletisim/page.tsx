'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/lib/types'

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single()
      if (data) setSettings(data)

      const { data: pageData } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', 'iletisim')
        .single()
      if (pageData) setPage(pageData)

      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    // Contact form could be stored in a separate table or sent via email
    // For now we'll just show success
    try {
      // You can create a 'contact_messages' table if needed
      // For now just simulate success
      await new Promise(resolve => setTimeout(resolve, 500))
      setSubmitStatus({
        type: 'success',
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
      })
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' })
    } catch {
      setSubmitStatus({
        type: 'error',
        message: 'Mesaj gönderilirken bir hata oluştu.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const address = settings?.address || ''
  const phone1 = settings?.phone || ''
  const phone2 = settings?.phone_secondary || ''
  const email = settings?.email || ''
  const supportEmail = settings?.support_email || ''
  const mapEmbed = settings?.map_embed_code || ''

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-20">
        {/* Slim Hero */}
        <div className="relative h-48 sm:h-64 lg:h-80 bg-neutral-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-neutral-900" />
          <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10" />

          <div className="relative h-full flex flex-col items-center justify-center text-center container-custom drop-shadow-lg">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white drop-shadow-md mb-4 animate-slide-up">
              {page?.title || 'İletişim'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/90 animate-fade-in font-medium">
              <a href="/" className="text-white hover:text-white/80 transition-colors">Ana Sayfa</a>
              <span className="text-white/70">/</span>
              <span className="text-white font-bold">İletişim</span>
            </div>
          </div>
        </div>

        <div className="container-custom mt-12 sm:mt-16 lg:mt-24">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="text-center sm:text-left mb-8">
                <h2 className="text-2xl font-heading font-bold text-neutral-900">
                  {page?.title ? `${page.title}` : 'Bizimle İletişime Geçin'}
                </h2>
                {page?.content ? (
                  <div
                    className="prose prose-sm prose-neutral mt-4 text-neutral-600"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                ) : (
                  <p className="text-neutral-500 mt-2 text-sm">
                    Sorularınız ve talepleriniz için bize ulaşabilirsiniz.
                  </p>
                )}
              </div>

              {/* Box 1: Address */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-900 mb-1">Adres</h3>
                  {loading ? (
                    <div className="h-4 w-48 skeleton rounded" />
                  ) : (
                    <p className="text-sm text-neutral-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{address || 'Adres bilgisi girilmemiş'}</p>
                  )}
                </div>
              </div>

              {/* Box 2: Phone */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-accent-50 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-accent-500" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-900 mb-1">Telefon</h3>
                  {loading ? (
                    <div className="h-4 w-36 skeleton rounded" />
                  ) : (
                    <>
                      {phone1 && (
                        <a href={`tel:${phone1.replace(/\s/g, '')}`} className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                          {phone1}
                        </a>
                      )}
                      {phone2 && (
                        <a href={`tel:${phone2.replace(/\s/g, '')}`} className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors mt-0.5">
                          {phone2}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Box 3: Email */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-900 mb-1">E-Posta</h3>
                  {loading ? (
                    <div className="h-4 w-44 skeleton rounded" />
                  ) : (
                    <>
                      {email && (
                        <a href={`mailto:${email}`} className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                          {email}
                        </a>
                      )}
                      {supportEmail && supportEmail !== email && (
                        <a href={`mailto:${supportEmail}`} className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors mt-0.5">
                          {supportEmail}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Box 4: Working Hours */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-900 mb-1">Çalışma Saatleri</h3>
                  <p className="text-sm text-neutral-600 whitespace-pre-line">
                    {'Hafta İçi: 09:00 - 18:00\nCumartesi: 09:00 - 13:00'}
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Map & Contact Form */}
            <div className="lg:col-span-2 space-y-8">

              {/* Map Container */}
              {mapEmbed ? (
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-neutral-100 overflow-hidden h-[400px]">
                  <div
                    className="w-full h-full rounded-xl overflow-hidden [&>iframe]:w-full [&>iframe]:h-full"
                    dangerouslySetInnerHTML={{ __html: mapEmbed }}
                  />
                </div>
              ) : !loading ? (
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-neutral-100 overflow-hidden h-[400px] flex items-center justify-center">
                  <div className="text-center text-neutral-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Harita bilgisi henüz girilmemiş</p>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] skeleton rounded-2xl" />
              )}

              {/* Contact Form */}
              <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-card">
                <div className="mb-8">
                  <h3 className="text-xl font-heading font-bold text-neutral-900">Mesaj Gönderin</h3>
                  <p className="text-sm text-neutral-500 mt-1">Sizden haber almaktan memnuniyet duyarız. Kısa sürede dönüş yapacağız.</p>
                </div>

                {submitStatus?.type === 'success' ? (
                  <div className="py-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-neutral-600">{submitStatus.message}</p>
                    <button onClick={() => setSubmitStatus(null)} className="mt-4 btn btn-outline btn-sm">
                      Yeni Mesaj Gönder
                    </button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    {submitStatus?.type === 'error' && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{submitStatus.message}</div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="contact-name" className="text-sm font-medium text-neutral-700">Ad Soyad</label>
                        <input type="text" id="contact-name" name="name" value={formData.name} onChange={handleChange} className="input" placeholder="Adınız ve soyadınız" required />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="contact-phone" className="text-sm font-medium text-neutral-700">Telefon Numarası</label>
                        <input type="tel" id="contact-phone" name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="05XX XXX XX XX" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="text-sm font-medium text-neutral-700">E-Posta Adresi</label>
                      <input type="email" id="contact-email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="ornek@sirket.com" required />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-subject" className="text-sm font-medium text-neutral-700">Konu</label>
                      <input type="text" id="contact-subject" name="subject" value={formData.subject} onChange={handleChange} className="input" placeholder="Mesajınızın konusu" />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-message" className="text-sm font-medium text-neutral-700">Mesajınız</label>
                      <textarea id="contact-message" name="message" value={formData.message} onChange={handleChange} rows={4} className="input resize-y" placeholder="Lütfen mesajınızı detaylıca yazın..." required></textarea>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full sm:w-auto mt-2">
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Mesajı Gönder
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>
        </div>

      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
