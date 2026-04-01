'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const businessAreas = [
  'Elektrik ve Taahhüt',
  'İnşaat ve Mimarlık',
  'Mühendislik ve Danışmanlık',
  'Toptan & Perakende Satış',
  'Güneş Enerjisi Sistemleri Kurulumu (EPC)',
  'Diğer'
]

export default function DealerApplicationPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    businessArea: '',
    taxOffice: '',
    taxNumber: '',
    address: '',
    city: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const { error } = await supabase
        .from('dealer_applications')
        .insert([{
          company_name: formData.companyName,
          contact_name: formData.contactName,
          phone: formData.phone,
          email: formData.email,
          business_area: formData.businessArea,
          tax_office: formData.taxOffice,
          tax_number: formData.taxNumber,
          address: formData.address,
          city: formData.city || null,
          status: 'pending'
        }])

      if (error) throw error

      setSubmitStatus({
        type: 'success',
        message: 'Bayilik başvurunuz başarıyla alınmıştır. Ekibimiz en kısa sürede sizinle iletişime geçecektir.'
      })

      // Reset form
      setFormData({
        companyName: '',
        contactName: '',
        phone: '',
        email: '',
        businessArea: '',
        taxOffice: '',
        taxNumber: '',
        address: '',
        city: ''
      })

    } catch (error: any) {
      console.error('Dealer application error:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Başvuru sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz veya telefonla bize ulaşınız.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
              Bayilik Başvurusu
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/90 animate-fade-in font-medium">
              <a href="/" className="text-white hover:text-white/80 transition-colors">Ana Sayfa</a>
              <span className="text-white/70">/</span>
              <span className="text-white font-bold">Bayilik Başvurusu</span>
            </div>
          </div>
        </div>

        <div className="container-custom mt-12 sm:mt-16 lg:mt-24">
          <div className="max-w-4xl mx-auto">

            {/* Intro text */}
            <div className="text-center mb-10 sm:mb-12">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                <Building2 className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900 mb-4">
                Enerji Ailesine Katılın
              </h2>
              <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                Enerji Dükkanı'nın güçlü tedarik ağından, özel bayi fiyatlarından ve teknik destek avantajlarından faydalanmak için aşağıdaki formu doldurarak iş ortağımız olabilirsiniz.
              </p>
            </div>

            {/* Application Form */}
            <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-card border border-neutral-100 relative overflow-hidden">

              {/* Decorative background shape */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl pointer-events-none" />

              {submitStatus?.type === 'success' ? (
                <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in relative z-10">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading text-neutral-900 mb-3">Tebrikler!</h3>
                  <p className="text-neutral-600 max-w-md mx-auto">{submitStatus.message}</p>
                  <button
                    onClick={() => setSubmitStatus(null)}
                    className="mt-8 btn btn-outline"
                  >
                    Yeni Başvuru Yap
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                  {submitStatus?.type === 'error' && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 animate-fade-in">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{submitStatus.message}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                    {/* Firma Ünvanı */}
                    <div className="space-y-2">
                      <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700">Firma Ünvanı *</label>
                      <input
                        required
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="input"
                        placeholder="Tam resmi ünvan"
                      />
                    </div>

                    {/* Yetkili */}
                    <div className="space-y-2">
                      <label htmlFor="contactName" className="block text-sm font-medium text-neutral-700">Yetkili Adı Soyadı *</label>
                      <input
                        required
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        className="input"
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>

                    {/* Telefon */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">Telefon Numarası *</label>
                      <input
                        required
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input"
                        placeholder="05XX XXX XX XX"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700">E-Posta Adresi *</label>
                      <input
                        required
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input"
                        placeholder="ornek@sirket.com"
                      />
                    </div>

                    {/* Faaliyet Alanı */}
                    <div className="space-y-2">
                      <label htmlFor="businessArea" className="block text-sm font-medium text-neutral-700">Faaliyet Alanı *</label>
                      <select
                        required
                        id="businessArea"
                        name="businessArea"
                        value={formData.businessArea}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm border-1.5 border-neutral-200 rounded-md bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                      >
                        <option value="" disabled>Lütfen seçiniz</option>
                        {businessAreas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>

                    {/* Vergi / TC */}
                    <div className="space-y-2">
                      <label htmlFor="taxNumber" className="block text-sm font-medium text-neutral-700">Vergi No / TC Kimlik No *</label>
                      <input
                        required
                        type="text"
                        id="taxNumber"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        className="input"
                        placeholder="Vergi numaranız veya TC kimlik numaranız"
                      />
                    </div>
                  </div>

                  {/* Vergi Dairesi */}
                  <div className="space-y-2">
                    <label htmlFor="taxOffice" className="block text-sm font-medium text-neutral-700">Vergi Dairesi *</label>
                    <input
                      required
                      type="text"
                      id="taxOffice"
                      name="taxOffice"
                      value={formData.taxOffice}
                      onChange={handleChange}
                      className="input"
                      placeholder="Şirketinizin kayıtlı olduğu vergi dairesi"
                    />
                  </div>

                  {/* Şehir */}
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-sm font-medium text-neutral-700">Şehir</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="Firmanızın bulunduğu şehir"
                    />
                  </div>

                  {/* Açık Adres */}
                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-medium text-neutral-700">Açık Adres *</label>
                    <textarea
                      required
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={5}
                      className="input resize-y"
                      placeholder="Firma adresinizi detaylı olarak yazınız..."
                    />
                  </div>

                  {/* KVKK / Submit */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-neutral-100">
                    <label className="flex items-start gap-3 cursor-pointer group w-full sm:w-auto">
                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                        <input required type="checkbox" className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-neutral-300 rounded focus:border-primary-500 peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors" />
                        <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-neutral-600 select-none">
                        <a href="/kvkk-aydinlatma" className="text-primary-600 font-medium hover:underline" target="_blank">KVKK Aydınlatma Metni&apos;ni</a> okudum ve kabul ediyorum. *
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg w-full sm:w-auto mt-2 sm:mt-0"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Gönderiliyor...
                        </>
                      ) : (
                        'Başvuruyu Tamamla'
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
