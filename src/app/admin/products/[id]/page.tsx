import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { ProductForm } from '@/components/admin/product-form'

interface Props {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: 'asc' } },
    },
  })
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

async function getBrands() {
  return prisma.brand.findMany({
    orderBy: { name: 'asc' },
  })
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  const [product, categories, brands] = await Promise.all([
    getProduct(id),
    getCategories(),
    getBrands(),
  ])

  if (!product) {
    notFound()
  }

  // Transform product data for the form
  const productData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    price: parseFloat(product.price.toString()),
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
    categoryId: product.categoryId,
    brandId: product.brandId,
    frameType: product.frameType,
    frameShape: product.frameShape,
    frameMaterial: product.frameMaterial,
    frameWidth: product.frameWidth,
    lensWidth: product.lensWidth,
    bridgeWidth: product.bridgeWidth,
    templeLength: product.templeLength,
    lensHeight: product.lensHeight,
    frameWeight: product.frameWeight ? parseFloat(product.frameWeight.toString()) : null,
    quantity: product.inventory,
    lowStockThreshold: product.lowStockThreshold,
    trackInventory: product.trackInventory,
    isActive: product.status === 'ACTIVE',
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
    })),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Edit Product
          </h1>
          <p className="text-gray-500 mt-1">
            Update product details for {product.name}
          </p>
        </div>
      </div>

      <ProductForm
        categories={categories}
        brands={brands}
        product={productData}
      />
    </div>
  )
}
