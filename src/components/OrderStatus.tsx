import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Mail, Download } from 'lucide-react';
import { OrderManager } from '../lib/orderManagement';
import { TicketGenerator } from '../lib/ticketGeneration';
import { EmailNotificationService } from '../lib/emailNotifications';
import type { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderStatusProps {
  orderId: string;
  onStatusChange?: (status: string) => void;
}

interface OrderWithDetails extends Order {
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
    image_url: string;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    price_cents: number;
    ticket_type: {
      id: string;
      name: string;
      price_cents: number;
    };
  }>;
  tickets: Array<{
    id: string;
    ticket_number: string;
    code: string;
    qr_code: string | null;
    status: string;
  }>;
}

export default function OrderStatus({ orderId, onStatusChange }: OrderStatusProps) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const orderDetails = await OrderManager.getOrderWithDetails(orderId);
      
      if (!orderDetails) {
        setError('Order tidak ditemukan');
        return;
      }

      setOrder(orderDetails);
      onStatusChange?.(orderDetails.status);
      setError(null);
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  }, [orderId, onStatusChange]);

  useEffect(() => {
    loadOrderDetails();
    
    // Poll for status updates every 30 seconds for pending orders
    const interval = setInterval(() => {
      if (order?.status === 'pending_payment') {
        loadOrderDetails();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [orderId, loadOrderDetails, order?.status]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending_payment') return;
    
    try {
      setActionLoading('cancel');
      const success = await OrderManager.cancelOrder(orderId);
      
      if (success) {
        await loadOrderDetails();
      } else {
        setError('Gagal membatalkan pesanan');
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      setError('Gagal membatalkan pesanan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendEmail = async () => {
    if (!order) return;
    
    try {
      setActionLoading('email');
      const success = await EmailNotificationService.sendOrderConfirmation(orderId);
      
      if (success) {
        alert('Email konfirmasi telah dikirim ulang');
      } else {
        setError('Gagal mengirim email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Gagal mengirim email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadTicket = async (ticketId: string) => {
    try {
      setActionLoading(`download-${ticketId}`);
      const pdfUrl = await TicketGenerator.generateTicketPDF(ticketId);
      
      // In a real implementation, this would trigger a download
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('Error downloading ticket:', err);
      setError('Gagal mengunduh tiket');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'refunded':
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'paid':
        return 'Dibayar';
      case 'cancelled':
        return 'Dibatalkan';
      case 'expired':
        return 'Kedaluwarsa';
      case 'refunded':
        return 'Dikembalikan';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amountCents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amountCents / 100);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Kedaluwarsa';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}j ${minutes}m tersisa`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Memuat detail pesanan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadOrderDetails}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Pesanan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Order Status Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(order.status)}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pesanan #{order.id.slice(-8)}</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </div>
            </div>
          </div>
          
          {order.status === 'pending_payment' && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Batas waktu pembayaran:</p>
              <p className="text-lg font-semibold text-red-600">
                {order.expires_at ? getTimeRemaining(order.expires_at) : 'Tidak ada batas waktu'}
              </p>
            </div>
          )}
        </div>

        {/* Payment Status Message */}
        {order.status === 'pending_payment' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">Menunggu Pembayaran</p>
                <p className="text-yellow-700 text-sm">
                  Silakan lakukan pembayaran untuk mengkonfirmasi pesanan Anda.
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">Pembayaran Berhasil</p>
                <p className="text-green-700 text-sm">
                  Terima kasih! Tiket Anda telah dikonfirmasi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detail Event</h2>
        <div className="flex space-x-4">
          {order.event.image_url && (
            <img
              src={order.event.image_url}
              alt={order.event.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{order.event.title}</h3>
            <p className="text-gray-600">
              {new Date(order.event.date).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-gray-600">{order.event.venue}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tiket yang Dipesan</h2>
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <h4 className="font-medium text-gray-900">{item.ticket_type.name}</h4>
                <p className="text-sm text-gray-600">Harga: Rp {(item.ticket_type.price_cents / 100).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-900">
                  {item.quantity} x {formatCurrency(item.price_cents)}
                </p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.quantity * item.price_cents)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Biaya Layanan</span>
            <span className="text-gray-900">{formatCurrency(order.fees_cents)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-indigo-600">{formatCurrency(order.total_cents)}</span>
          </div>
        </div>
      </div>

      {/* Tickets Section (for paid orders) */}
      {order.status === 'paid' && order.tickets && order.tickets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tiket Anda</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {order.tickets.map((ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">Tiket #{ticket.ticket_number}</p>
                    <p className="text-sm text-gray-600">Status: {ticket.status}</p>
                  </div>
                  {ticket.qr_code && (
                    <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs text-gray-500">QR Code</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownloadTicket(ticket.id)}
                  disabled={actionLoading === `download-${ticket.id}`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {actionLoading === `download-${ticket.id}` ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Unduh Tiket
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aksi</h2>
        <div className="flex flex-wrap gap-3">
          {order.status === 'pending_payment' && (
            <>
              <button
                onClick={() => window.location.href = `/checkout/${orderId}`}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Lanjutkan Pembayaran
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading === 'cancel'}
                className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'cancel' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Batalkan Pesanan
              </button>
            </>
          )}
          
          <button
            onClick={handleResendEmail}
            disabled={actionLoading === 'email'}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'email' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Kirim Ulang Email
          </button>
          
          <button
            onClick={loadOrderDetails}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}