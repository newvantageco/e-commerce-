import { PrismaClient, Role, FrameType, FrameShape, FrameMaterial, LensType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@optica.com' },
    update: {},
    create: {
      email: 'admin@optica.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  })
  console.log('Created admin user:', admin.email)

  // Create demo customer
  const customerPassword = await bcrypt.hash('Customer123!', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.CUSTOMER,
      emailVerified: true,
    },
  })
  console.log('Created demo customer:', customer.email)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'eyeglasses' },
      update: {},
      create: {
        name: 'Eyeglasses',
        slug: 'eyeglasses',
        description: 'Prescription eyeglasses for everyday wear',
        image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sunglasses' },
      update: {},
      create: {
        name: 'Sunglasses',
        slug: 'sunglasses',
        description: 'Stylish sunglasses for UV protection',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'blue-light' },
      update: {},
      create: {
        name: 'Blue Light Glasses',
        slug: 'blue-light',
        description: 'Screen protection eyewear',
        image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'reading-glasses' },
      update: {},
      create: {
        name: 'Reading Glasses',
        slug: 'reading-glasses',
        description: 'Magnifying glasses for reading',
        image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Cases, cleaning kits, and more',
        image: 'https://images.unsplash.com/photo-1625591342274-013aa93a276f?w=600',
      },
    }),
  ])
  console.log('Created categories:', categories.length)

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'optica-originals' },
      update: {},
      create: {
        name: 'Optica Originals',
        slug: 'optica-originals',
        description: 'Our signature collection of premium eyewear',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'vista-modern' },
      update: {},
      create: {
        name: 'Vista Modern',
        slug: 'vista-modern',
        description: 'Contemporary designs for the modern professional',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'classic-frames' },
      update: {},
      create: {
        name: 'Classic Frames',
        slug: 'classic-frames',
        description: 'Timeless styles that never go out of fashion',
      },
    }),
  ])
  console.log('Created brands:', brands.length)

  // Create sample products
  const sampleProducts = [
    {
      name: 'Urban Navigator',
      slug: 'urban-navigator',
      description: 'Sleek rectangular frames perfect for the modern professional. Lightweight titanium construction with adjustable nose pads for all-day comfort.',
      shortDescription: 'Sleek titanium rectangular frames for professionals',
      sku: 'OPT-URB-001',
      price: 149.00,
      compareAtPrice: 199.00,
      frameType: FrameType.FULL_RIM,
      frameShape: FrameShape.RECTANGLE,
      frameMaterial: FrameMaterial.TITANIUM,
      frameWidth: 'Medium',
      lensWidth: 54,
      bridgeWidth: 18,
      templeLength: 145,
      lensHeight: 36,
      frameWeight: 18,
      categoryId: categories[0].id,
      brandId: brands[0].id,
      isFeatured: true,
      isNewArrival: true,
      quantity: 50,
      images: [
        'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800',
        'https://images.unsplash.com/photo-1577744486770-020ab432da65?w=800',
      ],
      variants: [
        { name: 'Matte Black', color: 'Black', colorCode: '#1a1a1a' },
        { name: 'Gunmetal', color: 'Gray', colorCode: '#555555' },
        { name: 'Gold', color: 'Gold', colorCode: '#d4af37' },
      ],
    },
    {
      name: 'Classic Aviator',
      slug: 'classic-aviator',
      description: 'Iconic aviator sunglasses with polarized lenses. Gold metal frame with crystal clear optics.',
      shortDescription: 'Iconic polarized aviator sunglasses',
      sku: 'OPT-AVT-001',
      price: 179.00,
      compareAtPrice: 229.00,
      frameType: FrameType.FULL_RIM,
      frameShape: FrameShape.AVIATOR,
      frameMaterial: FrameMaterial.METAL,
      frameWidth: 'Large',
      lensWidth: 58,
      bridgeWidth: 14,
      templeLength: 140,
      lensHeight: 50,
      frameWeight: 26,
      categoryId: categories[1].id,
      brandId: brands[2].id,
      isFeatured: true,
      isBestSeller: true,
      quantity: 75,
      images: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
      ],
      variants: [
        { name: 'Gold/Green', color: 'Gold', colorCode: '#d4af37' },
        { name: 'Silver/Blue', color: 'Silver', colorCode: '#c0c0c0' },
        { name: 'Rose Gold/Brown', color: 'Rose Gold', colorCode: '#b76e79' },
      ],
    },
    {
      name: 'Digital Shield',
      slug: 'digital-shield',
      description: 'Premium blue light blocking glasses designed for extended screen time. Reduces eye strain and improves sleep quality.',
      shortDescription: 'Blue light blocking glasses for digital wellness',
      sku: 'OPT-DIG-001',
      price: 89.00,
      frameType: FrameType.FULL_RIM,
      frameShape: FrameShape.SQUARE,
      frameMaterial: FrameMaterial.TR90,
      frameWidth: 'Medium',
      lensWidth: 52,
      bridgeWidth: 17,
      templeLength: 140,
      lensHeight: 40,
      frameWeight: 20,
      categoryId: categories[2].id,
      brandId: brands[1].id,
      isFeatured: true,
      isNewArrival: true,
      quantity: 100,
      images: [
        'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=800',
        'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      ],
      variants: [
        { name: 'Midnight Black', color: 'Black', colorCode: '#0a0a0a' },
        { name: 'Navy Blue', color: 'Navy', colorCode: '#000080' },
        { name: 'Crystal Clear', color: 'Clear', colorCode: '#f5f5f5' },
      ],
    },
    {
      name: 'Retro Round',
      slug: 'retro-round',
      description: 'Vintage-inspired round frames with a modern twist. Acetate construction in rich tortoise pattern.',
      shortDescription: 'Vintage round acetate frames',
      sku: 'OPT-RND-001',
      price: 129.00,
      compareAtPrice: 159.00,
      frameType: FrameType.FULL_RIM,
      frameShape: FrameShape.ROUND,
      frameMaterial: FrameMaterial.ACETATE,
      frameWidth: 'Narrow',
      lensWidth: 48,
      bridgeWidth: 20,
      templeLength: 145,
      lensHeight: 42,
      frameWeight: 24,
      categoryId: categories[0].id,
      brandId: brands[2].id,
      isBestSeller: true,
      quantity: 60,
      images: [
        'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800',
        'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800',
      ],
      variants: [
        { name: 'Tortoise', color: 'Tortoise', colorCode: '#6b4423' },
        { name: 'Jet Black', color: 'Black', colorCode: '#0a0a0a' },
        { name: 'Honey Crystal', color: 'Honey', colorCode: '#eb9605' },
      ],
    },
    {
      name: 'Sport Flex',
      slug: 'sport-flex',
      description: 'High-performance sports sunglasses with wraparound design. Polarized lenses and rubber grip temples.',
      shortDescription: 'Performance wraparound sports sunglasses',
      sku: 'OPT-SPT-001',
      price: 159.00,
      frameType: FrameType.FULL_RIM,
      frameShape: FrameShape.WRAP,
      frameMaterial: FrameMaterial.TR90,
      frameWidth: 'Wide',
      lensWidth: 66,
      bridgeWidth: 12,
      templeLength: 125,
      lensHeight: 44,
      frameWeight: 22,
      categoryId: categories[1].id,
      brandId: brands[1].id,
      isNewArrival: true,
      quantity: 40,
      images: [
        'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800',
        'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800',
      ],
      variants: [
        { name: 'Matte Black', color: 'Black', colorCode: '#1a1a1a' },
        { name: 'Racing Red', color: 'Red', colorCode: '#cc0000' },
        { name: 'Ocean Blue', color: 'Blue', colorCode: '#0066cc' },
      ],
    },
    {
      name: 'Cat Eye Luxe',
      slug: 'cat-eye-luxe',
      description: 'Elegant cat-eye frames that make a statement. Hand-polished acetate with gold metal accents.',
      shortDescription: 'Elegant cat-eye frames with gold accents',
      sku: 'OPT-CAT-001',
      price: 169.00,
      compareAtPrice: 219.00,
      frameType: FrameType.FULL_RIM,
      frameShape: FrameShape.CAT_EYE,
      frameMaterial: FrameMaterial.ACETATE,
      frameWidth: 'Medium',
      lensWidth: 53,
      bridgeWidth: 16,
      templeLength: 140,
      lensHeight: 38,
      frameWeight: 28,
      categoryId: categories[0].id,
      brandId: brands[0].id,
      isFeatured: true,
      quantity: 35,
      images: [
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800',
        'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800',
      ],
      variants: [
        { name: 'Bordeaux', color: 'Burgundy', colorCode: '#722f37' },
        { name: 'Emerald', color: 'Green', colorCode: '#046307' },
        { name: 'Classic Black', color: 'Black', colorCode: '#0a0a0a' },
      ],
    },
  ]

  for (const productData of sampleProducts) {
    const { images, variants, ...product } = productData

    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    })

    // Create images
    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          url: images[i],
          sortOrder: i,
          isPrimary: i === 0,
        },
      })
    }

    // Create variants
    for (const variant of variants) {
      await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          name: variant.name,
          sku: `${product.sku}-${variant.color?.toUpperCase().replace(' ', '')}`,
          color: variant.color,
          colorCode: variant.colorCode,
          quantity: Math.floor(Math.random() * 30) + 10,
        },
      })
    }

    console.log('Created product:', createdProduct.name)
  }

  // Create a sample coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME15' },
    update: {},
    create: {
      code: 'WELCOME15',
      description: '15% off your first order',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumPurchase: 50,
      usageLimit: 1000,
      isActive: true,
    },
  })
  console.log('Created welcome coupon: WELCOME15')

  // Create settings
  const settings = [
    { key: 'site_name', value: JSON.stringify('Optica Glasses'), group: 'general' },
    { key: 'site_description', value: JSON.stringify('Premium Eyewear & Prescription Glasses'), group: 'general' },
    { key: 'contact_email', value: JSON.stringify('support@optica.com'), group: 'general' },
    { key: 'currency', value: JSON.stringify('USD'), group: 'general' },
    { key: 'tax_rate', value: JSON.stringify(0.08), group: 'checkout' },
    { key: 'free_shipping_threshold', value: JSON.stringify(100), group: 'shipping' },
    { key: 'standard_shipping_rate', value: JSON.stringify(9.99), group: 'shipping' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('Created settings')

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
