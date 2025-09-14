import { supabase } from './supabase';
import { OrderManager, type OrderWithDetails } from './orderManagement';
import { TicketGenerator } from './ticketGeneration';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  attachments?: {
    filename: string;
    content: string;
    type: string;
  }[];
}

export interface NotificationPreferences {
  orderConfirmation: boolean;
  paymentReminder: boolean;
  eventReminder: boolean;
  ticketDelivery: boolean;
}

/**
 * Email Notification System
 */
export class EmailNotificationService {
  private static readonly FROM_EMAIL = 'noreply@pestapora.com';
  private static readonly FROM_NAME = 'Pestapora';

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(orderId: string): Promise<boolean> {
    try {
      const orderDetails = await OrderManager.getOrderWithDetails(orderId);
      
      if (!orderDetails) {
        throw new Error('Order not found');
      }

      if (!orderDetails.customer_email) {
        throw new Error('Customer email not found');
      }

      const template = await this.generateOrderConfirmationTemplate(orderDetails);
      
      const emailData: EmailData = {
        to: orderDetails.customer_email,
        from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        subject: template.subject,
        html: template.htmlContent,
        text: template.textContent,
      };

      // If order is paid, attach tickets
      if (orderDetails.status === 'paid') {
        const tickets = await TicketGenerator.getUserTickets(orderDetails.user_id);
        const orderTickets = tickets.filter(t => t.orderId === orderId);
        
        // Generate ticket PDFs (placeholder)
        emailData.attachments = await Promise.all(
          orderTickets.map(async (ticket) => {
            const pdfUrl = await TicketGenerator.generateTicketPDF(ticket.id);
            return {
              filename: `ticket-${ticket.ticketNumber}.pdf`,
              content: pdfUrl, // In real implementation, this would be base64 PDF content
              type: 'application/pdf',
            };
          })
        );
      }

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      return false;
    }
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminder(orderId: string): Promise<boolean> {
    try {
      const orderDetails = await OrderManager.getOrderWithDetails(orderId);
      
      if (!orderDetails || orderDetails.status !== 'pending_payment') {
        return false;
      }

      if (!orderDetails.customer_email) {
        throw new Error('Customer email not found');
      }

      const template = await this.generatePaymentReminderTemplate(orderDetails);
      
      const emailData: EmailData = {
        to: orderDetails.customer_email,
        from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        subject: template.subject,
        html: template.htmlContent,
        text: template.textContent,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return false;
    }
  }

  /**
   * Send event reminder email
   */
  static async sendEventReminder(eventId: string): Promise<number> {
    try {
      // Get all paid orders for the event
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          event:events(*)
        `)
        .eq('event_id', eventId)
        .eq('status', 'paid');

      if (error || !orders) {
        throw new Error(`Failed to get orders: ${error?.message}`);
      }

      let sentCount = 0;

      for (const order of orders) {
        if (order.customer_email) {
          const template = await this.generateEventReminderTemplate(order);
          
          const emailData: EmailData = {
            to: order.customer_email,
            from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
            subject: template.subject,
            html: template.htmlContent,
            text: template.textContent,
          };

          const sent = await this.sendEmail(emailData);
          if (sent) sentCount++;
        }
      }

      return sentCount;
    } catch (error) {
      console.error('Error sending event reminders:', error);
      return 0;
    }
  }

  /**
   * Send ticket delivery email
   */
  static async sendTicketDelivery(orderId: string): Promise<boolean> {
    try {
      const orderDetails = await OrderManager.getOrderWithDetails(orderId);
      
      if (!orderDetails || orderDetails.status !== 'paid') {
        return false;
      }

      if (!orderDetails.customer_email) {
        throw new Error('Customer email not found');
      }

      const tickets = orderDetails.tickets;
      
      if (!tickets || tickets.length === 0) {
        throw new Error('No tickets found for order');
      }

      const template = await this.generateTicketDeliveryTemplate(orderDetails);
      
      // Generate ticket PDFs
      const attachments = await Promise.all(
        tickets.map(async (ticket) => {
          const pdfUrl = await TicketGenerator.generateTicketPDF(ticket.id);
          return {
            filename: `ticket-${ticket.ticket_number}.pdf`,
            content: pdfUrl, // In real implementation, this would be base64 PDF content
            type: 'application/pdf',
          };
        })
      );

      const emailData: EmailData = {
        to: orderDetails.customer_email,
        from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        subject: template.subject,
        html: template.htmlContent,
        text: template.textContent,
        attachments,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending ticket delivery:', error);
      return false;
    }
  }

  /**
   * Generate order confirmation email template
   */
  private static async generateOrderConfirmationTemplate(order: OrderWithDetails): Promise<EmailTemplate> {
    const isPaid = order.status === 'paid';
    const subject = isPaid 
      ? `Konfirmasi Pembayaran - ${order.event.title}`
      : `Pesanan Dibuat - ${order.event.title}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .ticket-item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-weight: bold; font-size: 18px; color: #6366f1; }
          .status { padding: 5px 10px; border-radius: 3px; color: white; }
          .status.paid { background: #10b981; }
          .status.pending { background: #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pestapora</h1>
            <h2>${subject}</h2>
          </div>
          
          <div class="content">
            <p>Halo ${order.customer_name || 'Customer'},</p>
            
            ${isPaid 
              ? '<p>Terima kasih! Pembayaran Anda telah berhasil diproses.</p>'
              : '<p>Pesanan Anda telah dibuat. Silakan lakukan pembayaran untuk mengkonfirmasi tiket Anda.</p>'
            }
            
            <div class="order-details">
              <h3>Detail Pesanan</h3>
              <p><strong>ID Pesanan:</strong> ${order.id}</p>
              <p><strong>Status:</strong> <span class="status ${order.status}">${this.formatOrderStatus(order.status)}</span></p>
              <p><strong>Event:</strong> ${(order.event as any).title}</p>
              <p><strong>Tanggal:</strong> ${new Date((order.event as any).date).toLocaleDateString('id-ID')}</p>
              <p><strong>Venue:</strong> ${(order.event as any).venue}</p>
              
              <h4>Tiket yang Dipesan:</h4>
              ${(order.order_items as any[]).map((item) => `
                <div class="ticket-item">
                  <strong>${item.ticket_type.name}</strong><br>
                  Jumlah: ${item.quantity} x ${this.formatCurrency(item.price_cents as number)}
                  = ${this.formatCurrency((item.quantity as number) * (item.price_cents as number))}
                </div>
              `).join('')}
              
              <div style="margin-top: 15px;">
                <p>Subtotal: ${this.formatCurrency(order.subtotal_cents)}</p>
                <p>Biaya Layanan: ${this.formatCurrency(order.fees_cents)}</p>
                <p class="total">Total: ${this.formatCurrency(order.total_cents)}</p>
              </div>
            </div>
            
            ${isPaid 
              ? '<p>Tiket Anda telah dikirim sebagai lampiran email ini. Silakan simpan dan bawa tiket saat menghadiri event.</p>'
              : `<p>Silakan lakukan pembayaran sebelum ${order.expires_at ? new Date(order.expires_at).toLocaleString('id-ID') : 'segera'} untuk mengkonfirmasi pesanan Anda.</p>`
            }
            
            <p>Jika Anda memiliki pertanyaan, silakan hubungi customer service kami.</p>
          </div>
          
          <div class="footer">
            <p>Terima kasih telah memilih Pestapora!</p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      ${subject}
      
      Halo ${order.customer_name || 'Customer'},
      
      ${isPaid 
        ? 'Terima kasih! Pembayaran Anda telah berhasil diproses.'
        : 'Pesanan Anda telah dibuat. Silakan lakukan pembayaran untuk mengkonfirmasi tiket Anda.'
      }
      
      Detail Pesanan:
      ID Pesanan: ${order.id}
      Status: ${this.formatOrderStatus(order.status)}
      Event: ${(order.event as any).title}
      Tanggal: ${new Date((order.event as any).date).toLocaleDateString('id-ID')}
      Venue: ${(order.event as any).venue}
      
      Tiket yang Dipesan:
      ${(order.order_items as any[]).map((item) => 
        `${item.ticket_type.name} - ${item.quantity} x ${this.formatCurrency(item.price_cents as number)} = ${this.formatCurrency((item.quantity as number) * (item.price_cents as number))}`
      ).join('\n')}
      
      Subtotal: ${this.formatCurrency(order.subtotal_cents)}
      Biaya Layanan: ${this.formatCurrency(order.fees_cents)}
      Total: ${this.formatCurrency(order.total_cents)}
      
      ${isPaid 
        ? 'Tiket Anda telah dikirim sebagai lampiran email ini.'
        : `Silakan lakukan pembayaran sebelum ${order.expires_at ? new Date(order.expires_at).toLocaleString('id-ID') : 'segera'}.`
      }
      
      Terima kasih telah memilih Pestapora!
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Generate payment reminder email template
   */
  private static async generatePaymentReminderTemplate(order: OrderWithDetails): Promise<EmailTemplate> {
    const subject = `Reminder Pembayaran - ${(order.event as any).title}`;
    const expiresAt = order.expires_at ? new Date(order.expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
    const timeLeft = Math.max(0, expiresAt.getTime() - Date.now());
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .urgent { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .cta-button { background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pestapora</h1>
            <h2>Reminder Pembayaran</h2>
          </div>
          
          <div class="content">
            <p>Halo ${order.customer_name || 'Customer'},</p>
            
            <div class="urgent">
              <h3>⏰ Pesanan Anda akan segera kedaluwarsa!</h3>
              <p>Waktu tersisa: <strong>${hoursLeft} jam ${minutesLeft} menit</strong></p>
            </div>
            
            <p>Pesanan Anda untuk event <strong>${order.event.title}</strong> masih menunggu pembayaran.</p>
            
            <p><strong>Total yang harus dibayar:</strong> ${this.formatCurrency(order.total_cents)}</p>
            
            <a href="https://pestapora.com/checkout/${order.id}" class="cta-button">Bayar Sekarang</a>
            
            <p>Jika Anda tidak melakukan pembayaran sebelum ${expiresAt.toLocaleString('id-ID')}, pesanan akan otomatis dibatalkan.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Reminder Pembayaran - ${order.event.title}
      
      Halo ${order.customer_name || 'Customer'},
      
      Pesanan Anda akan segera kedaluwarsa!
      Waktu tersisa: ${hoursLeft} jam ${minutesLeft} menit
      
      Pesanan untuk event ${(order.event as any).title} masih menunggu pembayaran.
      Total: ${this.formatCurrency(order.total_cents)}
      
      Silakan lakukan pembayaran sebelum ${expiresAt.toLocaleString('id-ID')}.
      
      Link pembayaran: https://pestapora.com/checkout/${order.id}
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Generate event reminder email template
   */
  private static async generateEventReminderTemplate(order: OrderWithDetails): Promise<EmailTemplate> {
    const subject = `Reminder Event - ${(order.event as any).title}`;
    const eventDate = new Date((order.event as any).date);
    const timeUntilEvent = eventDate.getTime() - Date.now();
    const daysUntilEvent = Math.floor(timeUntilEvent / (1000 * 60 * 60 * 24));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .event-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pestapora</h1>
            <h2>Event Reminder</h2>
          </div>
          
          <div class="content">
            <p>Halo ${order.customer_name || 'Customer'},</p>
            
            <p>Event <strong>${(order.event as any).title}</strong> akan dimulai dalam ${daysUntilEvent} hari!</p>
            
            <div class="event-info">
              <h3>Detail Event</h3>
              <p><strong>Event:</strong> ${(order.event as any).title}</p>
              <p><strong>Tanggal:</strong> ${eventDate.toLocaleDateString('id-ID')}</p>
              <p><strong>Waktu:</strong> ${eventDate.toLocaleTimeString('id-ID')}</p>
              <p><strong>Venue:</strong> ${(order.event as any).venue}</p>
            </div>
            
            <p>Jangan lupa untuk membawa tiket Anda. Pastikan untuk datang tepat waktu!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Event Reminder - ${order.event.title}
      
      Halo ${order.customer_name || 'Customer'},
      
      Event ${(order.event as any).title} akan dimulai dalam ${daysUntilEvent} hari!
      
      Detail Event:
      Event: ${(order.event as any).title}
      Tanggal: ${eventDate.toLocaleDateString('id-ID')}
      Waktu: ${eventDate.toLocaleTimeString('id-ID')}
      Venue: ${(order.event as any).venue}
      
      Jangan lupa untuk membawa tiket Anda!
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Generate ticket delivery email template
   */
  private static async generateTicketDeliveryTemplate(order: OrderWithDetails): Promise<EmailTemplate> {
    const subject = `Tiket Anda - ${(order.event as any).title}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .ticket-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pestapora</h1>
            <h2>Tiket Anda Siap!</h2>
          </div>
          
          <div class="content">
            <p>Halo ${order.customer_name || 'Customer'},</p>
            
            <p>Tiket untuk event <strong>${(order.event as any).title}</strong> telah siap dan terlampir dalam email ini.</p>
            
            <div class="ticket-info">
              <h3>Informasi Tiket</h3>
              <p><strong>Jumlah Tiket:</strong> ${(order.tickets as any[]).length}</p>
              <p><strong>Event:</strong> ${(order.event as any).title}</p>
              <p><strong>Tanggal:</strong> ${new Date((order.event as any).date).toLocaleDateString('id-ID')}</p>
              <p><strong>Venue:</strong> ${(order.event as any).venue}</p>
            </div>
            
            <p><strong>Penting:</strong></p>
            <ul>
              <li>Simpan tiket ini dengan baik</li>
              <li>Bawa tiket (cetak atau digital) saat menghadiri event</li>
              <li>Tiket hanya berlaku untuk satu kali masuk</li>
              <li>Datang tepat waktu untuk menghindari antrian</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Tiket Anda - ${order.event.title}
      
      Halo ${order.customer_name || 'Customer'},
      
      Tiket untuk event ${(order.event as any).title} telah siap dan terlampir dalam email ini.
      
      Informasi Tiket:
      Jumlah Tiket: ${(order.tickets as any[]).length}
      Event: ${(order.event as any).title}
      Tanggal: ${new Date((order.event as any).date).toLocaleDateString('id-ID')}
      Venue: ${(order.event as any).venue}
      
      Penting:
      - Simpan tiket ini dengan baik
      - Bawa tiket saat menghadiri event
      - Tiket hanya berlaku untuk satu kali masuk
      - Datang tepat waktu
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Send email (placeholder implementation)
   */
  private static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service
      // like SendGrid, Mailgun, AWS SES, etc.
      
      console.log('Sending email:', {
        to: emailData.to,
        subject: emailData.subject,
        attachments: emailData.attachments?.length || 0,
      });
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 95% success rate
      return Math.random() > 0.05;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Utility functions
   */
  private static formatCurrency(amountCents: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amountCents / 100);
  }

  private static formatOrderStatus(status: string): string {
    const statusMap = {
      pending: 'Menunggu Pembayaran',
      paid: 'Dibayar',
      cancelled: 'Dibatalkan',
      expired: 'Kedaluwarsa',
      refunded: 'Dikembalikan',
    };
    
    return statusMap[status as keyof typeof statusMap] || status;
  }

  /**
   * Schedule payment reminders
   */
  static async schedulePaymentReminders(): Promise<number> {
    try {
      // Get pending orders that expire in the next 2 hours
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending')
        .lt('expires_at', twoHoursFromNow)
        .gt('expires_at', new Date().toISOString());

      if (error || !orders) {
        throw new Error(`Failed to get pending orders: ${error?.message}`);
      }

      let sentCount = 0;
      
      for (const order of orders) {
        const sent = await this.sendPaymentReminder(order.id);
        if (sent) sentCount++;
      }

      return sentCount;
    } catch (error) {
      console.error('Error scheduling payment reminders:', error);
      return 0;
    }
  }

  /**
   * Schedule event reminders
   */
  static async scheduleEventReminders(): Promise<number> {
    try {
      // Get events happening in the next 24 hours
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const { data: events, error } = await supabase
        .from('events')
        .select('id')
        .gte('date', new Date().toISOString())
        .lt('date', tomorrow);

      if (error || !events) {
        throw new Error(`Failed to get upcoming events: ${error?.message}`);
      }

      let totalSent = 0;
      
      for (const event of events) {
        const sent = await this.sendEventReminder(event.id);
        totalSent += sent;
      }

      return totalSent;
    } catch (error) {
      console.error('Error scheduling event reminders:', error);
      return 0;
    }
  }
}

// Export utility functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeEmailContent(content: string): string {
  // Basic HTML sanitization
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');
}