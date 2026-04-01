import { Truck, Shield, Headphones, CreditCard } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Ücretsiz Kargo',
    description: '500₺ üzeri siparişlerde ücretsiz kargo',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Güvenli Ödeme',
    description: '256-bit SSL ile güvenli alışveriş',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Headphones,
    title: 'Teknik Destek',
    description: '7/24 teknik destek hattı',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: CreditCard,
    title: 'Taksit İmkanı',
    description: '12 aya varan taksit seçenekleri',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
]

export default function TrustBadges() {
  return (
    <section className="py-10 bg-white border-y border-neutral-100" id="trust-badges">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div
                className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-neutral-800">
                  {feature.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
