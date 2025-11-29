# Optica - Premium Eyewear E-Commerce Platform

A full-featured e-commerce platform for selling prescription glasses and accessories, built with modern web technologies and designed for deployment on Railway.

![Optica Preview](https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200)

## Features

### Storefront
- **Modern UI** - Beautiful, responsive design inspired by leading eyewear retailers (Warby Parker, Zenni)
- **Product Catalog** - Browse eyeglasses, sunglasses, blue light glasses, and accessories
- **Advanced Filtering** - Filter by frame type, shape, material, color, price, and more
- **Product Variants** - Support for multiple colors, lens types, and configurations
- **Shopping Cart** - Persistent cart with guest and authenticated user support
- **Wishlist** - Save favorite products for later
- **Reviews & Ratings** - Customer reviews with verified purchase badges
- **Newsletter Signup** - Email capture for marketing

### Checkout & Payments
- **Stripe Integration** - Secure payment processing with Payment Intents API
- **Coupon System** - Percentage, fixed amount, and free shipping discounts
- **Guest Checkout** - No account required to complete purchase
- **Order Confirmation** - Email notifications for order updates
- **Tax Calculation** - Configurable tax rates

### Admin Dashboard
- **Dashboard Analytics** - Revenue, orders, customers overview
- **Product Management** - Full CRUD for products, variants, images
- **Order Management** - View, update status, process refunds
- **Customer Management** - View customer details and order history
- **Coupon Management** - Create and manage discount codes
- **Inventory Tracking** - Low stock alerts and inventory management

### API & Integrations
- **Full REST API** - Complete API for all store operations
- **API Key Authentication** - Secure programmatic access
- **Webhook Support** - Stripe webhooks for payment events
- **Email Notifications** - Transactional emails via Nodemailer

### Security & Access Control
- **Role-Based Access Control (RBAC)** - Customer, Staff, Manager, Admin, Super Admin
- **JWT Authentication** - Secure session management
- **Permission System** - Granular permissions for API and admin actions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Payments**: Stripe
- **Email**: Nodemailer
- **Deployment**: Railway

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- SMTP server (for emails)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd optica-glasses-store
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/optica_glasses"

# Application
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

### Demo Credentials

After seeding the database:

- **Admin**: admin@optica.com / Admin123!
- **Customer**: customer@example.com / Customer123!

## API Documentation

### Authentication

All API endpoints support two authentication methods:

1. **Session Cookie** - For browser-based requests
2. **API Key** - For programmatic access

```bash
# Using API Key
curl -H "X-API-Key: opt_your_api_key" https://your-domain.com/api/products
```

### API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new account |
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/me` | Get current user |

#### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product (admin) |
| GET | `/api/products/:id` | Get product details |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/products/:id/reviews` | Get product reviews |
| POST | `/api/products/:id/reviews` | Create review |

#### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category (admin) |
| GET | `/api/categories/:id` | Get category |
| PUT | `/api/categories/:id` | Update category (admin) |

#### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get current cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:itemId` | Update cart item |
| DELETE | `/api/cart/:itemId` | Remove cart item |
| DELETE | `/api/cart` | Clear cart |

#### Checkout & Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout` | Create order & payment |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id` | Update order (admin) |
| POST | `/api/orders/:id/refund` | Refund order (admin) |

#### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons/validate` | Validate coupon code |
| GET | `/api/coupons` | List coupons (admin) |
| POST | `/api/coupons` | Create coupon (admin) |

#### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get user details |
| PUT | `/api/users/:id` | Update user |
| PUT | `/api/users/:id/role` | Update user role |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats (admin) |

#### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | List brands |
| POST | `/api/newsletter` | Subscribe to newsletter |
| GET | `/api/api-keys` | List API keys (admin) |
| POST | `/api/api-keys` | Create API key (admin) |
| GET | `/api/health` | Health check |

### Query Parameters

Products endpoint supports filtering:

```
GET /api/products?search=aviator&category=sunglasses&minPrice=50&maxPrice=200&frameShape=AVIATOR&isFeatured=true&page=1&limit=20&sortBy=price&sortOrder=asc
```

## Deployment on Railway

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Manual Deployment

1. **Create a new Railway project**

2. **Add PostgreSQL database**
   - Click "New Service" → "Database" → "PostgreSQL"

3. **Add your application**
   - Click "New Service" → "GitHub Repo"
   - Connect your repository

4. **Configure environment variables**
   - `DATABASE_URL` - Auto-populated by Railway
   - `NEXTAUTH_SECRET` - Generate a secure random string
   - `NEXTAUTH_URL` - Your Railway domain
   - `STRIPE_SECRET_KEY` - From Stripe dashboard
   - `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
   - `STRIPE_WEBHOOK_SECRET` - After setting up webhook
   - SMTP settings for email

5. **Deploy**
   - Railway will automatically build and deploy

6. **Run database migrations**
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.railway.app/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the webhook secret to your environment variables

## Project Structure

```
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed
├── src/
│   ├── app/
│   │   ├── (store)/     # Storefront pages
│   │   ├── admin/       # Admin dashboard
│   │   └── api/         # API routes
│   ├── components/
│   │   ├── admin/       # Admin components
│   │   ├── layout/      # Layout components
│   │   ├── product/     # Product components
│   │   └── ui/          # UI components
│   ├── lib/
│   │   ├── auth.ts      # Authentication
│   │   ├── db.ts        # Database client
│   │   ├── email.ts     # Email utilities
│   │   ├── stripe.ts    # Stripe utilities
│   │   └── utils.ts     # Utilities
│   └── store/           # Zustand stores
├── public/              # Static assets
└── ...config files
```

## Customization

### Adding New Frame Attributes

1. Update `prisma/schema.prisma` with new enum/fields
2. Run `npx prisma migrate dev`
3. Update `src/lib/utils.ts` with display values
4. Update product forms and filters

### Adding Payment Methods

1. Configure in Stripe Dashboard
2. Update checkout flow if needed
3. Stripe automatically handles available methods

### Email Templates

Email templates are in `src/lib/email.ts`. Customize HTML templates for:
- Order confirmation
- Shipping notification
- Welcome email
- Password reset

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@optica.com or open an issue in the repository.

---

Built with by the Optica Team
