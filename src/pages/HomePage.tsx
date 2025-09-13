import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { EventCard } from '../components/Events/EventCard';
import { BrutalButton } from '../components/Common/BrutalButton';
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { events } = useStore();
  const featuredEvents = events.filter(event => event.isFeatured).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <section className="bg-black text-white py-20 border-b-8 border-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-black text-4xl md:text-6xl lg:text-8xl uppercase tracking-tight mb-6">
            PESTAPORA
            <span className="text-[#00FF00] block">2025</span>
            <span className="text-[#FF0080]">FESTIVAL</span>
          </h1>
          
          <p className="font-bold text-lg md:text-xl uppercase max-w-3xl mx-auto mb-12 text-white">
            PERAYAAN KEBAHAGIAAN DI INDONESIA. SELEBRASI MUSIK SELAMA 3 HARI DENGAN RATUSAN GUEST STAR.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Link to="/events">
              <BrutalButton size="lg" icon={ArrowRight} className="w-full md:w-auto">
                EXPLORE EVENTS
              </BrutalButton>
            </Link>
            
            <Link to="/register">
              <BrutalButton variant="secondary" size="lg" className="w-full md:w-auto">
                BERGABUNG SEKARANG
              </BrutalButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-black text-3xl md:text-5xl uppercase text-center mb-16 text-black">
            MENGAPA PILIH <span className="text-[#00FF00]">PESTAPORA</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-8 text-center">
              <div className="bg-[#00FF00] w-16 h-16 border-4 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-black text-xl uppercase mb-4 text-black">PENGALAMAN TERBAIK</h3>
              <p className="font-bold text-sm uppercase text-black">
                FESTIVAL MUSIK TERBESAR DENGAN RATUSAN GUEST STAR TERBAIK.
              </p>
            </div>

            <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-8 text-center">
              <div className="bg-[#FF0080] w-16 h-16 border-4 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-black text-xl uppercase mb-4 text-black">KEAMANAN TERJAMIN</h3>
              <p className="font-bold text-sm uppercase text-black">
                SISTEM TICKETING AMAN DENGAN TEKNOLOGI TERDEPAN.
              </p>
            </div>

            <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-8 text-center">
              <div className="bg-[#00FFFF] w-16 h-16 border-4 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-black text-xl uppercase mb-4 text-black">LAYANAN 24/7</h3>
              <p className="font-bold text-sm uppercase text-black">
                CUSTOMER SERVICE SIAP MEMBANTU KAPAN SAJA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-black text-3xl md:text-5xl uppercase mb-6 text-black">
              EVENT <span className="text-[#FF0080]">UNGGULAN</span> PESTAPORA
            </h2>
            <p className="font-bold text-lg uppercase text-black max-w-2xl mx-auto">
              FESTIVAL MUSIK TERBAIK INDONESIA. PENGALAMAN YANG TAK TERLUPAKAN.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="text-center">
            <Link to="/events">
              <BrutalButton size="lg" icon={ArrowRight}>
                LIHAT SEMUA EVENT
              </BrutalButton>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#00FF00] py-20 border-t-8 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-black text-3xl md:text-5xl uppercase mb-6 text-black">
            SIAP BERPESTAPORA?
          </h2>
          <p className="font-bold text-lg uppercase mb-12 text-black">
            BERGABUNGLAH DENGAN RIBUAN PENGUNJUNG LAINNYA. RAYAKAN KEBAHAGIAAN BERSAMA!
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Link to="/register">
              <BrutalButton variant="secondary" size="lg" className="w-full md:w-auto">
                DAFTAR SEKARANG
              </BrutalButton>
            </Link>
            <Link to="/events">
              <BrutalButton variant="danger" size="lg" className="w-full md:w-auto">
                LIHAT EVENT
              </BrutalButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};