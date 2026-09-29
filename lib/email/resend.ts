import 'server-only';
import { Resend } from 'resend';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('your_resend_api_key')) {
    return null;
  }
  return new Resend(apiKey.trim());
}

export interface OrderEmailItem {
  title: string;
  variant?: string;
  quantity: number;
  price: string;
  imageUrl?: string;
}

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  subtotal: string;
  shipping: string;
  tax: string;
  discount?: string;
  total: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  trackingUrl?: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('[Email] RESEND_API_KEY not configured. Skipping confirmation email.');
    return { success: false, reason: 'unconfigured' };
  }

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #222;">
          <strong style="color: #ffffff; font-size: 14px;">${item.title}</strong>
          ${item.variant ? `<br/><span style="color: #888888; font-size: 12px;">${item.variant}</span>` : ''}
          <br/><span style="color: #666666; font-size: 12px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #222; text-align: right; color: #f97316; font-weight: bold; font-size: 14px;">
          ${item.price}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - Vital RP</title>
    </head>
    <body style="background-color: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #222222; border-radius: 16px; overflow: hidden; padding: 32px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0;">VITAL <span style="color: #f97316;">RP</span></h1>
          <p style="color: #888888; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px;">Official Merchandise</p>
        </div>

        <div style="background-color: rgba(249, 115, 22, 0.08); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #f97316; font-size: 18px; margin: 0 0 6px 0;">Order Confirmed!</h2>
          <p style="color: #dddddd; font-size: 14px; margin: 0;">Order <strong style="color: #ffffff;">#${data.orderNumber}</strong> has been received and submitted for production.</p>
        </div>

        <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">Hi ${data.customerName},</p>
        <p style="color: #999999; font-size: 14px; line-height: 1.6;">
          Thank you for supporting Vital Roleplay! Each piece of apparel is made on-demand specifically for you. We will send you another email with tracking details as soon as your package ships.
        </p>

        <h3 style="color: #ffffff; font-size: 15px; border-bottom: 1px solid #333; padding-bottom: 8px; margin-top: 28px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsHtml}
        </table>

        <div style="margin-left: auto; width: 220px; font-size: 13px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between; color: #888;">
            <span>Subtotal:</span> <span style="color: #fff;">${data.subtotal}</span>
          </div>
          ${data.discount ? `
          <div style="display: flex; justify-content: space-between; color: #10b981;">
            <span>Discount:</span> <span>-${data.discount}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; color: #888;">
            <span>Shipping:</span> <span style="color: #fff;">${data.shipping}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #888;">
            <span>Tax:</span> <span style="color: #fff;">${data.tax}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px;">
            <span style="color: #fff;">Total:</span> <span style="color: #f97316;">${data.total}</span>
          </div>
        </div>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #222; text-align: center;">
          <a href="${data.trackingUrl || 'https://vitalrp.net/merch'}" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
            View Order Status
          </a>
        </div>

        <div style="text-align: center; margin-top: 32px; font-size: 11px; color: #555555;">
          <p>© ${new Date().getFullYear()} Vital Roleplay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await resend.emails.send({
      from: 'Vital RP Merch <orders@vitalrp.net>',
      to: data.customerEmail,
      subject: `Order Confirmed: #${data.orderNumber} - Vital RP Merch`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (error: any) {
    console.error('Failed to send order confirmation email via Resend:', error);
    return { success: false, error: error.message };
  }
}

export async function sendShipmentNotificationEmail(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}) {
  const resend = getResendClient();
  if (!resend) return { success: false, reason: 'unconfigured' };

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="background-color: #0a0a0a; color: #ffffff; font-family: sans-serif; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #222222; border-radius: 16px; padding: 32px;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0 0 16px 0;">VITAL <span style="color: #f97316;">RP</span></h1>
        <h2 style="color: #10b981; font-size: 18px; margin: 0 0 12px 0;">Your package is on the way!</h2>
        <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
          Hi ${params.customerName}, order <strong>#${params.orderNumber}</strong> has shipped via <strong>${params.carrier}</strong>.
        </p>
        <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #888; font-size: 12px;">TRACKING NUMBER</p>
          <p style="margin: 4px 0 0 0; color: #fff; font-size: 16px; font-family: monospace; font-weight: bold;">${params.trackingNumber}</p>
        </div>
        ${params.trackingUrl ? `
        <a href="${params.trackingUrl}" style="display: inline-block; background-color: #f97316; color: #fff; font-weight: bold; font-size: 13px; text-transform: uppercase; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Track Package
        </a>` : ''}
      </div>
    </body>
    </html>
  `;

  try {
    const res = await resend.emails.send({
      from: 'Vital RP Merch <orders@vitalrp.net>',
      to: params.customerEmail,
      subject: `Your Vital RP Merch Has Shipped! (#${params.orderNumber})`,
      html,
    });
    return { success: true, id: res.data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
