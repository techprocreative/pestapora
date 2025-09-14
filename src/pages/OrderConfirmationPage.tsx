import React from 'react';
import { useParams } from 'react-router-dom';
import OrderStatus from '../components/OrderStatus';

export default function OrderConfirmationPage() {
  const { id: orderId } = useParams<{ id: string }>();

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order ID tidak ditemukan</h1>
          <p className="text-gray-600">Silakan periksa kembali link konfirmasi Anda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <OrderStatus orderId={orderId} />
    </div>
  );
}