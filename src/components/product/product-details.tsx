'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Share2,
  ShoppingBag,
  Check,
  ChevronDown,
  Star,
  Ruler,
  Shield,
  Truck,
  RefreshCw,
  Info,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ProductDetailsProps {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    shortDescription: string | null
    sku: string
    price: number
    compareAtPrice: number | null
    frameType: string | null
    frameShape: string | null
    frameMaterial: string | null
    frameWidth: string | null
    lensWidth: number | null
    bridgeWidth: number | null
    templeLength: number | null
    lensHeight: number | null
    frameWeight: number | null
    quantity: number
    images: Array<{ id: string; url: string; alt: string | null }>
    category: { id: string; name: string; slug: string } | null
    brand: { id: string; name: string; slug: string; logo: string | null } | null
    variants: Array<{
      id: string
      name: string
      sku: string
      color: string | null
      colorCode: string | null
      size: string | null
      lensType: string | null
      price: number | null
      quantity: number
      image: string | null
    }>
    reviews: Array<{
      id: string
      rating: number
      title: string | null
      content: string | null
      user: { firstName: string; lastName: string; avatar: string | null }
      createdAt: Date
    }>
    rating: number
    reviewCount: number
  }
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('description')

  const { addItem } = useCartStore()

  const currentVariant = selectedVariant
    ? product.variants.find((v) => v.id === selectedVariant)
    : null

  const currentPrice = currentVariant?.price || product.price
  const inStock = currentVariant
    ? currentVariant.quantity > 0
    : product.quantity > 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: currentVariant?.id,
      name: currentVariant
        ? `${product.name} - ${currentVariant.name}`
        : product.name,
      price: currentPrice,
      image: currentVariant?.image || product.images[0]?.url,
      quantity,
      variant: currentVariant
        ? { name: currentVariant.name, color: currentVariant.color || undefined }
        : undefined,
    })
    toast.success('Added to cart!')
  }

  const colorVariants = product.variants.filter((v) => v.colorCode)

  const specifications = [
    { label: 'SKU', value: product.sku },
    { label: 'Frame Type', value: product.frameType?.replace('_', ' ') },
    { label: 'Frame Shape', value: product.frameShape?.replace('_', ' ') },
    { label: 'Frame Material', value: product.frameMaterial?.replace('_', ' ') },
    { label: 'Frame Width', value: product.frameWidth },
    { label: 'Lens Width', value: product.lensWidth ? `${product.lensWidth}mm` : null },
    { label: 'Bridge Width', value: product.bridgeWidth ? `${product.bridgeWidth}mm` : null },
    { label: 'Temple Length', value: product.templeLength ? `${product.templeLength}mm` : null },
    { label: 'Lens Height', value: product.lensHeight ? `${product.lensHeight}mm` : null },
    { label: 'Frame Weight', value: product.frameWeight ? `${product.frameWeight}g` : null },
  ].filter((spec) => spec.value)

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`/${product.category.slug}`}
              className="hover:text-primary-600"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[selectedImage]?.url || '/images/placeholder.jpg'}
                  alt={product.images[selectedImage]?.alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                    selectedImage === index
                      ? 'border-primary-600'
                      : 'border-transparent hover:border-gray-300'
                  )}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand & Name */}
          {product.brand && (
            <Link
              href={`/brands/${product.brand.slug}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 uppercase tracking-wide"
            >
              {product.brand.name}
            </Link>
          )}

          <h1 className="text-3xl font-display font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < Math.round(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="badge-danger">
                  Save{' '}
                  {Math.round(
                    ((product.compareAtPrice - currentPrice) /
                      product.compareAtPrice) *
                      100
                  )}
                  %
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-gray-600">{product.shortDescription}</p>
          )}

          {/* Color Variants */}
          {colorVariants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Color:{' '}
                <span className="font-normal text-gray-500">
                  {currentVariant?.color || 'Select a color'}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={cn(
                      'w-10 h-10 rounded-full border-2 transition-all relative',
                      selectedVariant === variant.id
                        ? 'border-primary-600 ring-2 ring-primary-100'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    style={{ backgroundColor: variant.colorCode! }}
                    title={variant.color!}
                  >
                    {selectedVariant === variant.id && (
                      <Check
                        className={cn(
                          'absolute inset-0 m-auto h-5 w-5',
                          isLightColor(variant.colorCode!)
                            ? 'text-gray-900'
                            : 'text-white'
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              {inStock ? (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  In Stock
                </span>
              ) : (
                <span className="text-sm text-red-600">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-primary btn-lg flex-1"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </button>
            <button
              onClick={() => {
                setIsWishlisted(!isWishlisted)
                toast.success(
                  isWishlisted ? 'Removed from wishlist' : 'Added to wishlist'
                )
              }}
              className={cn(
                'btn-outline btn-lg',
                isWishlisted && 'text-red-500 border-red-500'
              )}
            >
              <Heart
                className={cn('h-5 w-5', isWishlisted && 'fill-current')}
              />
            </button>
            <button className="btn-outline btn-lg">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-primary-600" />
              <span>Free shipping over $100</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RefreshCw className="h-5 w-5 text-primary-600" />
              <span>30-day returns</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-primary-600" />
              <span>2-year warranty</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Ruler className="h-5 w-5 text-primary-600" />
              <span>Size guide available</span>
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="border-t pt-6 space-y-4">
            {/* Description */}
            <div className="border-b pb-4">
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === 'description' ? null : 'description'
                  )
                }
                className="flex items-center justify-between w-full"
              >
                <span className="font-medium">Description</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform',
                    expandedSection === 'description' && 'rotate-180'
                  )}
                />
              </button>
              {expandedSection === 'description' && product.description && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pt-4 prose-product"
                >
                  <p>{product.description}</p>
                </motion.div>
              )}
            </div>

            {/* Specifications */}
            {specifications.length > 0 && (
              <div className="border-b pb-4">
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === 'specifications'
                        ? null
                        : 'specifications'
                    )
                  }
                  className="flex items-center justify-between w-full"
                >
                  <span className="font-medium">Specifications</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 transition-transform',
                      expandedSection === 'specifications' && 'rotate-180'
                    )}
                  />
                </button>
                {expandedSection === 'specifications' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pt-4"
                  >
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      {specifications.map((spec) => (
                        <div key={spec.label}>
                          <dt className="text-gray-500">{spec.label}</dt>
                          <dd className="font-medium text-gray-900">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                )}
              </div>
            )}

            {/* Shipping */}
            <div className="border-b pb-4">
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === 'shipping' ? null : 'shipping'
                  )
                }
                className="flex items-center justify-between w-full"
              >
                <span className="font-medium">Shipping & Returns</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform',
                    expandedSection === 'shipping' && 'rotate-180'
                  )}
                />
              </button>
              {expandedSection === 'shipping' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pt-4 text-sm text-gray-600 space-y-2"
                >
                  <p>Free standard shipping on orders over $100.</p>
                  <p>Standard shipping: 5-7 business days.</p>
                  <p>Express shipping: 2-3 business days.</p>
                  <p>Free returns within 30 days of delivery.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews.length > 0 && (
        <section className="mt-16 pt-16 border-t">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-8">
            Customer Reviews
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                {review.title && (
                  <h4 className="font-medium text-gray-900 mb-2">
                    {review.title}
                  </h4>
                )}
                {review.content && (
                  <p className="text-gray-600 mb-4">{review.content}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-900">
                    {review.user.firstName} {review.user.lastName.charAt(0)}.
                  </span>
                  <span>|</span>
                  <span>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
