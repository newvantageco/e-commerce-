import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getProducts(params: { [key: string]: string | string[] | undefined }) {
  const page = Number(params.page) || 1
  const limit = 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (params.search) {
    where.OR = [
      { name: { contains: String(params.search), mode: 'insensitive' } },
      { sku: { contains: String(params.search), mode: 'insensitive' } },
    ]
  }

  if (params.category) {
    where.categoryId = params.category
  }

  if (params.lowStock === 'true') {
    where.trackInventory = true
    where.quantity = { lt: 5 }
  }

  if (params.active === 'false') {
    where.isActive = false
  } else {
    where.isActive = true
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        _count: { select: { variants: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return { products, total, totalPages: Math.ceil(total / limit), categories }
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const { products, total, totalPages, categories } = await getProducts(params)
  const currentPage = Number(params.page) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Products
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your product catalog ({total} total)
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                name="search"
                placeholder="Search products..."
                defaultValue={params.search as string}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            name="category"
            defaultValue={params.category as string}
            className="input w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="lowStock"
              defaultChecked={params.lowStock === 'true'}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">Low Stock Only</span>
          </label>
          <button type="submit" className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 max-w-[200px] truncate">
                            {product.name}
                          </p>
                          {product.brand && (
                            <p className="text-sm text-gray-500">
                              {product.brand.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatPrice(parseFloat(product.price.toString()))}
                        </p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(
                              parseFloat(product.compareAtPrice.toString())
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.quantity > 10
                            ? 'bg-green-100 text-green-800'
                            : product.quantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.trackInventory ? product.quantity : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                    <Link
                      href="/admin/products/new"
                      className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
                    >
                      Add your first product
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * 20 + 1} to{' '}
              {Math.min(currentPage * 20, total)} of {total} products
            </p>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`?page=${currentPage - 1}`}
                  className="btn-outline btn-sm"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?page=${currentPage + 1}`}
                  className="btn-outline btn-sm"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
