'use client'

import { useRouter, usePathname } from 'next/navigation'
import SortDropdown from './SortDropdown'

const SORT_OPTIONS = [
  { value: 'newest', label: 'En Yeniler' },
  { value: 'price_asc', label: 'Fiyata Göre Artan' },
  { value: 'price_desc', label: 'Fiyata Göre Azalan' },
]

interface Props {
  totalCount: number
  sortOption: string
  currentPage: number
  totalPages: number
  paginationOnly?: boolean
}

export default function CategoryControls({ totalCount, sortOption, currentPage, totalPages, paginationOnly = false }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(sort: string, page: number) {
    const params = new URLSearchParams()
    if (sort !== 'newest') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.push(pathname + (qs ? `?${qs}` : ''))
  }

  function handleSortChange(v: string) {
    navigate(v, 1)
  }

  function handlePage(page: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    navigate(sortOption, page)
  }

  const pagination = totalPages > 1 ? (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => handlePage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Önceki
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => handlePage(page)}
          className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-primary-600 text-white'
              : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => handlePage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Sonraki →
      </button>
    </div>
  ) : null

  if (paginationOnly) {
    return pagination
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
        <div className="text-sm font-medium text-neutral-500">
          <strong className="text-neutral-900">{totalCount}</strong> ürün bulundu
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm text-neutral-500 whitespace-nowrap hidden sm:inline">Sırala:</span>
          <SortDropdown value={sortOption} onChange={handleSortChange} options={SORT_OPTIONS} />
        </div>
      </div>
      {pagination}
    </>
  )
}
