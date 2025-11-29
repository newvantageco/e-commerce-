'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPrice, calculateDiscount, cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number | string
    compareAtPrice?: number | string | null
    images: Array<{ url: string; alt?: string }>
    category?: { name: string; slug: string }
    brand?: { name: string }
    rating?: number
    reviewCount?: number
    isNewArrival?: boolean
    isBestSeller?: boolean
    variants?: Array<{
      id: string
      color?: string
      colorCode?: string
    }>
  }
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedColor, setSelectedColor] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const { addItem } = useCartStore()

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  const compareAtPrice = product.compareAtPrice
    ? typeof product.compareAtPrice === 'string'
      ? parseFloat(product.compareAtPrice)
      : product.compareAtPrice
    : null

  const discount = compareAtPrice ? calculateDiscount(compareAtPrice, price) : 0

  const primaryImage = product.images[0]?.url || '/images/placeholder-product.jpg'
  const hoverImage = product.images[1]?.url || primaryImage

  const colors = product.variants?.filter((v) => v.colorCode) || []

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      price,
      image: primaryImage,
      quantity: 1,
    })
    toast.success('Added to cart!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('group relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {/* Images */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isHovered && product.images.length > 1 ? 'opacity-0' : 'opacity-100'
            )}
          />
          {product.images.length > 1 && (
            <Image
              src={hoverImage}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-opacity duration-300',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="badge-danger">-{discount}%</span>
            )}
            {product.isNewArrival && (
              <span className="badge-primary">New</span>
            )}
            {product.isBestSeller && (
              <span className="badge bg-yellow-100 text-yellow-800">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsWishlisted(!isWishlisted)
              toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
            }}
            className={cn(
              'absolute top-2 right-2 p-2 rounded-full bg-white shadow-md transition-all',
              'opacity-0 group-hover:opacity-100',
              isWishlisted && 'text-red-500'
            )}
          >
            <Heart
              className={cn('h-4 w-4', isWishlisted && 'fill-current')}
            />
          </button>

          {/* Quick actions */}
          <div
            className={cn(
              'absolute bottom-2 left-2 right-2 flex gap-2 transition-all duration-300',
              'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
            )}
          >
            <button
              onClick={handleQuickAdd}
              className="flex-1 btn-primary btn-sm"
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Add to Cart
            </button>
            <Link
              href={`/product/${product.slug}`}
              className="btn-secondary btn-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-3 space-y-1">
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {product.brand.name}
            </p>
          )}

          <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Rating */}
          {typeof product.rating === 'number' && product.rating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < Math.round(product.rating!)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              {product.reviewCount && (
                <span className="text-xs text-gray-500">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {formatPrice(price)}
            </span>
            {compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>

          {/* Color swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              {colors.slice(0, 5).map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedColor(index)
                  }}
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all',
                    selectedColor === index
                      ? 'border-primary-600 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  style={{ backgroundColor: variant.colorCode }}
                  title={variant.color}
                />
              ))}
              {colors.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{colors.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
