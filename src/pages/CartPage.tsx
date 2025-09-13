import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BrutalButton } from '../components/Common/BrutalButton';
import { Trash2, ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, events, removeFromCart, updateCartQuantity, isAuthenticated } = useStore();
  const navigate = useNavigate();

  const cartWithDetails = cart.map(item => {
    const event = events.find(e => e.id === item.eventId);
    const ticketType = event?.ticketTypes.find(t => t.id === item.ticketTypeId);
    return { ...item, event, ticketType };
  });

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalTickets = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (eventId: string, ticketTypeId: string, newQuantity: number) => {
    updateCartQuantity(eventId, ticketTypeId, newQuantity);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-black text-4xl md:text-6xl uppercase mb-8 text-black text-center">
            YOUR <span className="text-[#FF0080]">CART</span>
          </h1>
          
          <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-black mx-auto mb-6" />
            <h2 className="font-black text-2xl uppercase mb-4 text-black">
              YOUR CART IS EMPTY
            </h2>
            <p className="font-bold text-lg uppercase mb-8 text-black">
              NO EVENTS SELECTED. TIME TO CHANGE THAT.
            </p>
            <Link to="/events">
              <BrutalButton size="lg">
                BROWSE EVENTS
              </BrutalButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-black text-4xl md:text-6xl uppercase text-black">
            YOUR <span className="text-[#FF0080]">CART</span>
          </h1>
          <BrutalButton
            onClick={() => navigate('/events')}
            variant="secondary"
            icon={ArrowLeft}
          >
            CONTINUE SHOPPING
          </BrutalButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartWithDetails.map((item) => (
              <div
                key={`${item.eventId}-${item.ticketTypeId}`}
                className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Event Image */}
                  <div className="md:w-32 h-32 flex-shrink-0">
                    <img
                      src={item.event?.image}
                      alt={item.event?.title}
                      className="w-full h-full object-cover border-4 border-black"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-grow">
                    <h3 className="font-black text-xl uppercase mb-2 text-black">
                      {item.event?.title}
                    </h3>
                    <div className="font-bold text-sm uppercase text-black mb-2">
                      TICKET TYPE: {item.ticketType?.name}
                    </div>
                    <div className="font-bold text-sm uppercase text-black mb-4">
                      VENUE: {item.event?.venue}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm uppercase text-black">QTY:</span>
                        <button
                          onClick={() => handleQuantityChange(item.eventId, item.ticketTypeId, item.quantity - 1)}
                          className="bg-[#FF0000] text-white w-8 h-8 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-white hover:text-[#FF0000] transition-all font-black flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="bg-[#F5F5F5] border-2 border-black px-4 py-1 font-black text-black min-w-[50px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.eventId, item.ticketTypeId, item.quantity + 1)}
                          className="bg-[#00FF00] text-black w-8 h-8 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#00FF00] transition-all font-black flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-2xl text-black">
                          ${item.price * item.quantity}
                        </div>
                        <div className="font-bold text-sm uppercase text-black">
                          ${item.price} EACH
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex md:flex-col justify-end">
                    <button
                      onClick={() => removeFromCart(item.eventId, item.ticketTypeId)}
                      className="bg-[#FF0000] text-white p-3 border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-[#FF0000] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6 sticky top-8">
              <h3 className="font-black text-2xl uppercase mb-6 text-black">
                ORDER SUMMARY
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-black">TICKETS:</span>
                  <span className="font-black text-black">{totalTickets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-black">SUBTOTAL:</span>
                  <span className="font-black text-black">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-black">FEES:</span>
                  <span className="font-black text-black">Rp 0</span>
                </div>
                <div className="border-t-4 border-black pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xl uppercase text-black">TOTAL:</span>
                    <span className="font-black text-3xl text-black">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <BrutalButton
                onClick={handleCheckout}
                className="w-full mb-4"
                size="lg"
              >
                PROCEED TO CHECKOUT
              </BrutalButton>

              {!isAuthenticated && (
                <div className="bg-[#FFD700] text-black p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                  <p className="font-black text-sm uppercase text-center">
                    LOGIN REQUIRED FOR CHECKOUT
                  </p>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/events"
                  className="text-black font-bold text-sm uppercase hover:text-[#00FF00] transition-colors"
                >
                  ← CONTINUE SHOPPING
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};