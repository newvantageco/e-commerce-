import { prisma } from '@/lib/db'
import { ProductForm } from '@/components/admin/product-form'

async function getData() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return { categories, brands }
}

export default async function NewProductPage() {
  const { categories, brands } = await getData()

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Add New Product
        </h1>
        <p className="text-gray-500 mt-1">
          Create a new product for your store
        </p>
      </div>

      <ProductForm categories={categories} brands={brands} />
    </div>
  )
}
