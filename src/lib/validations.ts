import { z } from 'zod'

// Auth validations
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Product validations
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  frameType: z.enum(['FULL_RIM', 'SEMI_RIMLESS', 'RIMLESS']).optional().nullable(),
  frameShape: z
    .enum([
      'RECTANGLE',
      'SQUARE',
      'ROUND',
      'OVAL',
      'CAT_EYE',
      'AVIATOR',
      'BROWLINE',
      'GEOMETRIC',
      'OVERSIZED',
      'WRAP',
    ])
    .optional()
    .nullable(),
  frameMaterial: z
    .enum([
      'ACETATE',
      'METAL',
      'TITANIUM',
      'TR90',
      'WOOD',
      'MIXED',
      'PLASTIC',
      'STAINLESS_STEEL',
    ])
    .optional()
    .nullable(),
  frameWidth: z.string().optional().nullable(),
  lensWidth: z.number().int().positive().optional().nullable(),
  bridgeWidth: z.number().int().positive().optional().nullable(),
  templeLength: z.number().int().positive().optional().nullable(),
  lensHeight: z.number().int().positive().optional().nullable(),
  frameWeight: z.number().int().positive().optional().nullable(),
  accessoryType: z
    .enum([
      'CASE',
      'CLEANING_KIT',
      'LENS_CLOTH',
      'CHAIN',
      'STRAP',
      'NOSE_PADS',
      'TEMPLE_TIPS',
      'REPAIR_KIT',
      'ANTI_FOG_SPRAY',
      'OTHER',
    ])
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  trackInventory: z.boolean().default(true),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        sortOrder: z.number().int().default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
})

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  color: z.string().optional(),
  colorCode: z.string().optional(),
  size: z.string().optional(),
  lensType: z
    .enum([
      'CLEAR',
      'BLUE_LIGHT',
      'PHOTOCHROMIC',
      'POLARIZED',
      'SUNGLASSES',
      'READING',
      'PROGRESSIVE',
      'BIFOCAL',
      'NON_PRESCRIPTION',
    ])
    .optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
})

// Category validations
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

// Brand validations
export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
})

// Cart validations
export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  prescription: z
    .object({
      rightSphere: z.number().optional(),
      rightCylinder: z.number().optional(),
      rightAxis: z.number().optional(),
      rightAdd: z.number().optional(),
      leftSphere: z.number().optional(),
      leftCylinder: z.number().optional(),
      leftAxis: z.number().optional(),
      leftAdd: z.number().optional(),
      pd: z.number().optional(),
    })
    .optional(),
})

// Order validations
export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().default('US'),
  phone: z.string().optional(),
})

export const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: z.boolean().default(true),
  shippingMethod: z.string().optional(),
  couponCode: z.string().optional(),
  customerNote: z.string().optional(),
})

// Coupon validations
export const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric'),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y']),
  discountValue: z.number().positive('Discount value must be positive'),
  minimumPurchase: z.number().positive().optional(),
  maximumDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
})

// Review validations
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).optional(),
})

// API Key validations
export const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
})

// Newsletter validations
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  source: z.string().optional(),
})

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Search & Filter
export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  frameType: z.string().optional(),
  frameShape: z.string().optional(),
  frameMaterial: z.string().optional(),
  lensType: z.string().optional(),
  color: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
})

// User update
export const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
})

export const userRoleUpdateSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
})

// Types
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type BrandInput = z.infer<typeof brandSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type CouponInput = z.infer<typeof couponSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ApiKeyInput = z.infer<typeof apiKeySchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
