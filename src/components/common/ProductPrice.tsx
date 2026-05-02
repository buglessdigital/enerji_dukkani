'use client'

import { useDealer } from '@/context/DealerContext'

interface Props {
  price: number
  salePrice?: number | null
  dealerPrice?: number | null
  dealerSalePrice?: number | null
}

function fmt(price: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price)
}

export default function ProductPrice({ price, salePrice, dealerPrice, dealerSalePrice }: Props) {
  const { getDealerPrice } = useDealer()
  const basePrice = salePrice ?? price
  const dealerEffective = getDealerPrice(basePrice, dealerPrice ?? null, dealerSalePrice ?? null)

  if (dealerEffective != null) {
    const listPrice = dealerSalePrice != null && dealerPrice != null ? dealerPrice : basePrice
    return (
      <div className="flex flex-col">
        <span className="price-old">{fmt(listPrice)}</span>
        <span className="price-current leading-none text-blue-600">{fmt(dealerEffective)}</span>
        <span className="text-xs text-blue-500 font-medium">Bayi Fiyatı</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {salePrice && <span className="price-old">{fmt(price)}</span>}
      <span className="price-current leading-none">{fmt(salePrice ?? price)}</span>
    </div>
  )
}
