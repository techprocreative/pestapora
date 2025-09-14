import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Download, QrCode, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type TicketWithDetails = Database['public']['Tables']['tickets']['Row'] & {
  ticket_types: Database['public']['Tables']['ticket_types']['Row'];
  events: Database['public']['Tables']['events']['Row'];
  orders: Database['public']['Tables']['orders']['Row'];
};

export function MyTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const loadTickets = useCallback(async () => {
    try {
      const { data, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_types(*),
          events(*),
          orders(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        throw ticketsError;
      }

      setTickets(data || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Gagal memuat tiket Anda');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setError('Anda harus login untuk melihat tiket');
      setLoading(false);
      return;
    }

    loadTickets();
  }, [user, loadTickets]);

  const filteredTickets = tickets.filter(ticket => {
    const eventDate = new Date(ticket.events.starts_at);
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return eventDate >= now;
      case 'past':
        return eventDate < now;
      default:
        return true;
    }
  });



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'used':
        return 'Sudah Digunakan';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            to="/events"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Jelajahi Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tiket Saya</h1>
          <p className="text-gray-600">Kelola dan lihat semua tiket event Anda</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'upcoming', label: 'Mendatang', count: tickets.filter(t => new Date(t.events.starts_at) >= new Date()).length },
                { key: 'past', label: 'Selesai', count: tickets.filter(t => new Date(t.events.starts_at) < new Date()).length },
                { key: 'all', label: 'Semua', count: tickets.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'upcoming' | 'past')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'upcoming' ? 'Tidak ada tiket mendatang' : 
               filter === 'past' ? 'Tidak ada tiket selesai' : 'Belum ada tiket'}
            </h3>
            <p className="text-gray-600 mb-8">
              {filter === 'all' ? 'Anda belum membeli tiket apapun. Jelajahi event menarik dan dapatkan tiket Anda!' : 
               'Tidak ada tiket dalam kategori ini.'}
            </p>
            <Link
              to="/events"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Jelajahi Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Image */}
                    {ticket.events.image_url && (
                      <div className="lg:w-48 flex-shrink-0">
                        <img
                          src={ticket.events.image_url}
                          alt={ticket.events.title}
                          className="w-full h-32 lg:h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {ticket.events.title}
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="text-sm">
                                {format(new Date(ticket.events.starts_at), 'dd MMMM yyyy', { locale: id })}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              <span className="text-sm">
                                {format(new Date(ticket.events.starts_at), 'HH:mm', { locale: id })} - 
                                {format(new Date(ticket.events.ends_at), 'HH:mm', { locale: id })}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="text-sm">{ticket.events.venue}</span>
                            </div>
                          </div>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                      </div>
                      
                      {/* Ticket Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Jenis Tiket</p>
                            <p className="font-medium">{ticket.ticket_types.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Nomor Tiket</p>
                            <p className="font-mono text-sm">{ticket.code}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Order ID</p>
                            <p className="font-mono text-sm">{ticket.order_id}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <QrCode className="h-4 w-4 mr-2" />
                          Lihat QR Code
                        </button>
                        
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </button>
                        
                        <Link
                          to={`/order-confirmation/${ticket.order_id}`}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Lihat Detail Order
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}