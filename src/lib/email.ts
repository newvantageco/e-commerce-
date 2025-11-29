import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Optica Glasses <noreply@optica.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new Error('Failed to send email')
  }
}

// Email Templates
export function orderConfirmationEmail(order: {
  orderNumber: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  shipping: number
  tax: number
  total: number
}): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0ea5e9; margin: 0;">Optica Glasses</h1>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #1e293b;">Order Confirmation</h2>
        <p>Hi ${order.customerName},</p>
        <p>Thank you for your order! We've received your order and will begin processing it soon.</p>
        <p style="font-size: 18px; font-weight: bold; color: #0ea5e9;">Order #${order.orderNumber}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left;">Item</th>
            <th style="padding: 12px; text-align: center;">Qty</th>
            <th style="padding: 12px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right;">Subtotal:</td>
            <td style="padding: 12px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right;">Shipping:</td>
            <td style="padding: 12px; text-align: right;">$${order.shipping.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right;">Tax:</td>
            <td style="padding: 12px; text-align: right;">$${order.tax.toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 18px;">
            <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
            <td style="padding: 12px; text-align: right; color: #0ea5e9;">$${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p>If you have any questions, please contact us at support@optica.com</p>
        <p>&copy; ${new Date().getFullYear()} Optica Glasses. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export function shippingConfirmationEmail(order: {
  orderNumber: string
  customerName: string
  trackingNumber: string
  trackingUrl?: string
  carrier?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0ea5e9; margin: 0;">Optica Glasses</h1>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #1e293b;">Your Order Has Shipped!</h2>
        <p>Hi ${order.customerName},</p>
        <p>Great news! Your order #${order.orderNumber} has been shipped and is on its way to you.</p>

        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          ${order.carrier ? `<p><strong>Carrier:</strong> ${order.carrier}</p>` : ''}
          <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
          ${
            order.trackingUrl
              ? `<a href="${order.trackingUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Track Your Package</a>`
              : ''
          }
        </div>
      </div>

      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p>If you have any questions, please contact us at support@optica.com</p>
        <p>&copy; ${new Date().getFullYear()} Optica Glasses. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export function welcomeEmail(user: { firstName: string; email: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0ea5e9; margin: 0;">Optica Glasses</h1>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #1e293b;">Welcome to Optica!</h2>
        <p>Hi ${user.firstName},</p>
        <p>Welcome to Optica Glasses! We're thrilled to have you join our community of eyewear enthusiasts.</p>
        <p>Here's what you can do with your new account:</p>
        <ul>
          <li>Browse our collection of premium eyewear</li>
          <li>Save your favorite frames to your wishlist</li>
          <li>Track your orders and view order history</li>
          <li>Get exclusive member-only discounts</li>
        </ul>

        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/shop" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Start Shopping</a>
      </div>

      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p>Need help? Contact us at support@optica.com</p>
        <p>&copy; ${new Date().getFullYear()} Optica Glasses. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export function passwordResetEmail(user: {
  firstName: string
  resetUrl: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0ea5e9; margin: 0;">Optica Glasses</h1>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #1e293b;">Reset Your Password</h2>
        <p>Hi ${user.firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>

        <a href="${user.resetUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>

        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p>&copy; ${new Date().getFullYear()} Optica Glasses. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}
