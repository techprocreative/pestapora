import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { BrutalButton } from '../components/Common/BrutalButton';
import { Calendar, MapPin, User, Ticket, ArrowLeft, Plus, Minus } from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, addToCart, isAuthenticated } = useStore();
  
  const event = events.find(e => e.id === id);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!event) {
      navigate('/events');
    }
  }, [event, navigate]);

  if (!event) return null;

  const handleTicketQuantityChange = (ticketTypeId: string, quantity: number) => {
    const ticketType = event.ticketTypes.find(t => t.id === ticketTypeId);
    if (!ticketType) return;

    const maxAllowed = Math.min(ticketType.maxQuantity, ticketType.available);
    const newQuantity = Math.max(0, Math.min(quantity, maxAllowed));
    
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: newQuantity
    }));
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    Object.entries(selectedTickets).forEach(([ticketTypeId, quantity]) => {
      if (quantity > 0) {
        const ticketType = event.ticketTypes.find(t => t.id === ticketTypeId);
        if (ticketType) {
          addToCart({
            eventId: event.id,
            ticketTypeId,
            quantity,
            price: ticketType.price
          });
        }
      }
    });

    navigate('/cart');
  };

  const totalSelectedTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(selectedTickets).reduce((sum, [ticketTypeId, quantity]) => {
    const ticketType = event.ticketTypes.find(t => t.id === ticketTypeId);
    return sum + (ticketType ? ticketType.price * quantity : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <BrutalButton
          onClick={() => navigate('/events')}
          variant="secondary"
          icon={ArrowLeft}
          className="mb-8"
        >
          BACK TO EVENTS
        </BrutalButton>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="relative">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover border-6 border-black shadow-[12px_12px_0px_#000000]"
              />
              {event.isFeatured && (
                <div className="absolute top-6 right-6 bg-[#FFD700] text-black px-4 py-2 border-4 border-black shadow-[4px_4px_0px_#000000] font-black text-sm uppercase">
                  FEATURED EVENT
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-8">
              <div className="mb-6">
                <div className="bg-[#FF0080] text-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000000] font-black text-xs uppercase inline-block mb-4">
                  {event.category}
                </div>
                <h1 className="font-black text-3xl md:text-5xl uppercase leading-tight mb-4 text-black">
                  {event.title}
                </h1>
                <p className="font-bold text-lg uppercase text-black">
                  {event.description}
                </p>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-black" />
                    <div>
                      <div className="font-black text-sm uppercase text-black">DATE & TIME</div>
                      <div className="font-bold text-lg text-black">
                        {format(event.date, 'MMMM dd, yyyy')} AT {event.time}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-black" />
                    <div>
                      <div className="font-black text-sm uppercase text-black">VENUE</div>
                      <div className="font-bold text-lg text-black">{event.venue}</div>
                      <div className="font-bold text-sm text-black uppercase">{event.address}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-black" />
                    <div>
                      <div className="font-black text-sm uppercase text-black">ORGANIZER</div>
                      <div className="font-bold text-lg text-black">{event.organizer}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Ticket className="h-6 w-6 text-black" />
                    <div>
                      <div className="font-black text-sm uppercase text-black">CAPACITY</div>
                      <div className="font-bold text-lg text-black">
                        {event.totalSeats - event.bookedSeats.length} / {event.totalSeats} AVAILABLE
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#00FFFF] text-black px-3 py-1 border-2 border-black font-black text-sm uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6 sticky top-8">
              <h3 className="font-black text-2xl uppercase mb-6 text-black">
                SELECT TICKETS
              </h3>

              <div className="space-y-6">
                {event.ticketTypes.map((ticketType) => (
                  <div key={ticketType.id} className="border-4 border-black p-4 space-y-3" style={{ backgroundColor: ticketType.color + '20' }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-lg uppercase text-black">
                          {ticketType.name}
                        </h4>
                        <p className="font-bold text-sm uppercase text-black">
                          {ticketType.description}
                        </p>
                        <div className="mt-2">
                          <span className="font-black text-2xl text-black">
                            Rp {ticketType.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-sm font-bold uppercase text-black">
                          {ticketType.available} AVAILABLE
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm uppercase text-black">QUANTITY:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTicketQuantityChange(ticketType.id, (selectedTickets[ticketType.id] || 0) - 1)}
                          className="bg-[#FF0000] text-white w-8 h-8 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-white hover:text-[#FF0000] transition-all font-black flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="bg-white border-2 border-black px-4 py-2 font-black text-black min-w-[50px] text-center">
                          {selectedTickets[ticketType.id] || 0}
                        </span>
                        <button
                          onClick={() => handleTicketQuantityChange(ticketType.id, (selectedTickets[ticketType.id] || 0) + 1)}
                          className="bg-[#00FF00] text-black w-8 h-8 border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#00FF00] transition-all font-black flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Checkout */}
              {totalSelectedTickets > 0 && (
                <div className="mt-6 pt-6 border-t-4 border-black">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black text-lg uppercase text-black">TOTAL:</span>
                    <span className="font-black text-2xl text-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="mb-4">
                    <span className="font-bold text-sm uppercase text-black">
                      {totalSelectedTickets} TICKETS SELECTED
                    </span>
                  </div>
                  <BrutalButton
                    onClick={handleAddToCart}
                    className="w-full"
                    size="lg"
                  >
                    ADD TO CART
                  </BrutalButton>
                </div>
              )}

              {!isAuthenticated && (
                <div className="mt-6 bg-[#FFD700] text-black p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                  <p className="font-black text-sm uppercase text-center">
                    LOGIN TO PURCHASE TICKETS
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};