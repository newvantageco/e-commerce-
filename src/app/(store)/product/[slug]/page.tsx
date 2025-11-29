import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ProductDetails } from '@/components/product/product-details'
import { ProductCard } from '@/components/ui/product-card'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      variants: { where: { isActive: true } },
      reviews: {
        where: { isApproved: true },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  brandId: string | null
) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      OR: [
        { categoryId: categoryId || undefined },
        { brandId: brandId || undefined },
      ],
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      brand: { select: { name: true } },
    },
    take: 4,
  })
}

async function getProductRating(productId: string) {
  return prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.metaTitle || product.name,
    description:
      product.metaDescription ||
      product.shortDescription ||
      product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || undefined,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const [relatedProducts, ratingData] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, product.brandId),
    getProductRating(product.id),
  ])

  const productWithPrices = {
    ...product,
    price: parseFloat(product.price.toString()),
    compareAtPrice: product.compareAtPrice
      ? parseFloat(product.compareAtPrice.toString())
      : null,
    costPrice: product.costPrice
      ? parseFloat(product.costPrice.toString())
      : null,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price ? parseFloat(v.price.toString()) : null,
      compareAtPrice: v.compareAtPrice
        ? parseFloat(v.compareAtPrice.toString())
        : null,
    })),
    rating: ratingData._avg.rating || 0,
    reviewCount: ratingData._count.rating,
  }

  return (
    <>
      <ProductDetails product={productWithPrices} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 border-t">
          <div className="container">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={{
                    ...related,
                    price: parseFloat(related.price.toString()),
                    compareAtPrice: related.compareAtPrice
                      ? parseFloat(related.compareAtPrice.toString())
                      : null,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
