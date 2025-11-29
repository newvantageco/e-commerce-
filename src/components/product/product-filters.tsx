'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FRAME_SHAPES, FRAME_MATERIALS, FRAME_TYPES } from '@/lib/utils'

interface ProductFiltersProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    _count: { products: number }
  }>
  brands: Array<{
    id: string
    name: string
    slug: string
    _count: { products: number }
  }>
  currentFilters: Record<string, string | string[] | undefined>
}

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $150', min: 100, max: 150 },
  { label: '$150 - $200', min: 150, max: 200 },
  { label: 'Over $200', min: 200, max: undefined },
]

export function ProductFilters({
  categories,
  brands,
  currentFilters,
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [openSections, setOpenSections] = useState<string[]>([
    'categories',
    'price',
    'frameShape',
  ])

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    // Reset to page 1 when filtering
    params.delete('page')

    router.push(`/shop?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/shop')
  }

  const activeFilterCount = [
    currentFilters.category,
    currentFilters.brand,
    currentFilters.minPrice || currentFilters.maxPrice,
    currentFilters.frameShape,
    currentFilters.frameMaterial,
    currentFilters.frameType,
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-xl border p-4 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Categories */}
      <FilterSection
        title="Categories"
        isOpen={openSections.includes('categories')}
        onToggle={() => toggleSection('categories')}
      >
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('category', undefined)}
            className={cn(
              'block w-full text-left px-2 py-1.5 rounded text-sm',
              !currentFilters.category
                ? 'bg-primary-50 text-primary-600 font-medium'
                : 'hover:bg-gray-50'
            )}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateFilter('category', category.slug)}
              className={cn(
                'flex items-center justify-between w-full px-2 py-1.5 rounded text-sm',
                currentFilters.category === category.slug
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-gray-50'
              )}
            >
              <span>{category.name}</span>
              <span className="text-gray-400">{category._count.products}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title="Price"
        isOpen={openSections.includes('price')}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-2">
          {priceRanges.map((range) => {
            const isActive =
              currentFilters.minPrice === String(range.min) ||
              (range.max === undefined &&
                currentFilters.minPrice === String(range.min))

            return (
              <button
                key={range.label}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('minPrice', String(range.min))
                  if (range.max) {
                    params.set('maxPrice', String(range.max))
                  } else {
                    params.delete('maxPrice')
                  }
                  params.delete('page')
                  router.push(`/shop?${params.toString()}`)
                }}
                className={cn(
                  'block w-full text-left px-2 py-1.5 rounded text-sm',
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'hover:bg-gray-50'
                )}
              >
                {range.label}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Frame Shape */}
      <FilterSection
        title="Frame Shape"
        isOpen={openSections.includes('frameShape')}
        onToggle={() => toggleSection('frameShape')}
      >
        <div className="space-y-2">
          {FRAME_SHAPES.map((shape) => (
            <button
              key={shape.value}
              onClick={() =>
                updateFilter(
                  'frameShape',
                  currentFilters.frameShape === shape.value
                    ? undefined
                    : shape.value
                )
              }
              className={cn(
                'block w-full text-left px-2 py-1.5 rounded text-sm',
                currentFilters.frameShape === shape.value
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-gray-50'
              )}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Frame Material */}
      <FilterSection
        title="Frame Material"
        isOpen={openSections.includes('frameMaterial')}
        onToggle={() => toggleSection('frameMaterial')}
      >
        <div className="space-y-2">
          {FRAME_MATERIALS.map((material) => (
            <button
              key={material.value}
              onClick={() =>
                updateFilter(
                  'frameMaterial',
                  currentFilters.frameMaterial === material.value
                    ? undefined
                    : material.value
                )
              }
              className={cn(
                'block w-full text-left px-2 py-1.5 rounded text-sm',
                currentFilters.frameMaterial === material.value
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-gray-50'
              )}
            >
              {material.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Frame Type */}
      <FilterSection
        title="Frame Type"
        isOpen={openSections.includes('frameType')}
        onToggle={() => toggleSection('frameType')}
      >
        <div className="space-y-2">
          {FRAME_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() =>
                updateFilter(
                  'frameType',
                  currentFilters.frameType === type.value
                    ? undefined
                    : type.value
                )
              }
              className={cn(
                'block w-full text-left px-2 py-1.5 rounded text-sm',
                currentFilters.frameType === type.value
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-gray-50'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection
        title="Brands"
        isOpen={openSections.includes('brands')}
        onToggle={() => toggleSection('brands')}
      >
        <div className="space-y-2">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() =>
                updateFilter(
                  'brand',
                  currentFilters.brand === brand.slug ? undefined : brand.slug
                )
              }
              className={cn(
                'flex items-center justify-between w-full px-2 py-1.5 rounded text-sm',
                currentFilters.brand === brand.slug
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-gray-50'
              )}
            >
              <span>{brand.name}</span>
              <span className="text-gray-400">{brand._count.products}</span>
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}

function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-t py-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  )
}
