'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Save,
  Loader2,
  Plus,
  X,
  ImagePlus,
  Trash2,
  GripVertical,
} from 'lucide-react'
import {
  FRAME_SHAPES,
  FRAME_MATERIALS,
  FRAME_TYPES,
  LENS_TYPES,
  slugify,
  generateSku,
} from '@/lib/utils'
import toast from 'react-hot-toast'

interface ProductFormProps {
  categories: Array<{ id: string; name: string }>
  brands: Array<{ id: string; name: string }>
  product?: {
    id: string
    name: string
    slug: string
    description: string | null
    shortDescription: string | null
    sku: string
    price: number
    compareAtPrice: number | null
    categoryId: string | null
    brandId: string | null
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
    lowStockThreshold: number
    trackInventory: boolean
    isActive: boolean
    isFeatured: boolean
    isNewArrival: boolean
    isBestSeller: boolean
    metaTitle: string | null
    metaDescription: string | null
    images: Array<{ id: string; url: string; alt: string | null; isPrimary: boolean }>
  }
}

export function ProductForm({ categories, brands, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    sku: product?.sku || generateSku('OPT'),
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    frameType: product?.frameType || '',
    frameShape: product?.frameShape || '',
    frameMaterial: product?.frameMaterial || '',
    frameWidth: product?.frameWidth || '',
    lensWidth: product?.lensWidth || '',
    bridgeWidth: product?.bridgeWidth || '',
    templeLength: product?.templeLength || '',
    lensHeight: product?.lensHeight || '',
    frameWeight: product?.frameWeight || '',
    quantity: product?.quantity || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    trackInventory: product?.trackInventory ?? true,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNewArrival: product?.isNewArrival ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    metaTitle: product?.metaTitle || '',
    metaDescription: product?.metaDescription || '',
  })

  const [images, setImages] = useState<Array<{ url: string; alt: string }>>(
    product?.images.map((img) => ({ url: img.url, alt: img.alt || '' })) || []
  )

  const [newImageUrl, setNewImageUrl] = useState('')

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Auto-generate slug from name
    if (name === 'name' && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(value),
      }))
    }
  }

  const addImage = () => {
    if (!newImageUrl) return
    setImages((prev) => [...prev, { url: newImageUrl, alt: formData.name }])
    setNewImageUrl('')
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? Number(formData.compareAtPrice)
          : null,
        lensWidth: formData.lensWidth ? Number(formData.lensWidth) : null,
        bridgeWidth: formData.bridgeWidth ? Number(formData.bridgeWidth) : null,
        templeLength: formData.templeLength
          ? Number(formData.templeLength)
          : null,
        lensHeight: formData.lensHeight ? Number(formData.lensHeight) : null,
        frameWeight: formData.frameWeight ? Number(formData.frameWeight) : null,
        quantity: Number(formData.quantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        categoryId: formData.categoryId || null,
        brandId: formData.brandId || null,
        frameType: formData.frameType || null,
        frameShape: formData.frameShape || null,
        frameMaterial: formData.frameMaterial || null,
        images: images.map((img, index) => ({
          url: img.url,
          alt: img.alt,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      }

      const url = isEditing
        ? `/api/products/${product.id}`
        : '/api/products'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product')
      }

      toast.success(isEditing ? 'Product updated!' : 'Product created!')
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
                placeholder="e.g., Classic Aviator"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block">URL Slug</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input"
              placeholder="auto-generated-from-name"
            />
          </div>

          <div>
            <label className="label mb-1.5 block">Short Description</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="input"
              placeholder="Brief product summary"
              maxLength={200}
            />
          </div>

          <div>
            <label className="label mb-1.5 block">Full Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input"
              placeholder="Detailed product description..."
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Product Images</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
            <ImagePlus className="h-8 w-8 mb-2" />
            <span className="text-sm">Add Image</span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={addImage}
            disabled={!newImageUrl}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label mb-1.5 block">Price *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="input pl-7"
              />
            </div>
          </div>
          <div>
            <label className="label mb-1.5 block">Compare at Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                name="compareAtPrice"
                value={formData.compareAtPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input pl-7"
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <label className="label mb-1.5 block">Quantity in Stock</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="trackInventory"
              checked={formData.trackInventory}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Track inventory</span>
          </label>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Organization</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label mb-1.5 block">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Brand</label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isNewArrival"
              checked={formData.isNewArrival}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm">New Arrival</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isBestSeller"
              checked={formData.isBestSeller}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Best Seller</span>
          </label>
        </div>
      </div>

      {/* Frame Specifications */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Frame Specifications</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label mb-1.5 block">Frame Type</label>
            <select
              name="frameType"
              value={formData.frameType}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select type</option>
              {FRAME_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Frame Shape</label>
            <select
              name="frameShape"
              value={formData.frameShape}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select shape</option>
              {FRAME_SHAPES.map((shape) => (
                <option key={shape.value} value={shape.value}>
                  {shape.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Frame Material</label>
            <select
              name="frameMaterial"
              value={formData.frameMaterial}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select material</option>
              {FRAME_MATERIALS.map((material) => (
                <option key={material.value} value={material.value}>
                  {material.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div>
            <label className="label mb-1.5 block">Lens Width (mm)</label>
            <input
              type="number"
              name="lensWidth"
              value={formData.lensWidth}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Bridge Width (mm)</label>
            <input
              type="number"
              name="bridgeWidth"
              value={formData.bridgeWidth}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Temple Length (mm)</label>
            <input
              type="number"
              name="templeLength"
              value={formData.templeLength}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Lens Height (mm)</label>
            <input
              type="number"
              name="lensHeight"
              value={formData.lensHeight}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Weight (g)</label>
            <input
              type="number"
              name="frameWeight"
              value={formData.frameWeight}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">SEO</h2>
        <div className="space-y-4">
          <div>
            <label className="label mb-1.5 block">Meta Title</label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              className="input"
              maxLength={70}
              placeholder="Page title for search engines"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaTitle.length}/70 characters
            </p>
          </div>
          <div>
            <label className="label mb-1.5 block">Meta Description</label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              rows={2}
              className="input"
              maxLength={160}
              placeholder="Brief description for search results"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaDescription.length}/160 characters
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
        >
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              {isEditing ? 'Update Product' : 'Create Product'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
