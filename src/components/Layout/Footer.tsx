import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white border-t-8 border-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-[#00FF00]">PESTAPORA</h3>
            <p className="text-white font-bold text-sm uppercase">
              FESTIVAL MUSIK TERBESAR INDONESIA. PERAYAAN KEBAHAGIAAN BERSAMA.
            </p>
          </div>

          {/* Events */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-white uppercase">EVENTS</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white hover:text-[#00FFFF] font-bold text-sm uppercase transition-colors">FESTIVAL MUSIK</a></li>
              <li><a href="#" className="text-white hover:text-[#00FFFF] font-bold text-sm uppercase transition-colors">KONSER TRADISIONAL</a></li>
              <li><a href="#" className="text-white hover:text-[#00FFFF] font-bold text-sm uppercase transition-colors">WORKSHOP MUSIK</a></li>
              <li><a href="#" className="text-white hover:text-[#00FFFF] font-bold text-sm uppercase transition-colors">MEET & GREET</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-white uppercase">BANTUAN</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white hover:text-[#FF0080] font-bold text-sm uppercase transition-colors">PUSAT BANTUAN</a></li>
              <li><a href="#" className="text-white hover:text-[#FF0080] font-bold text-sm uppercase transition-colors">HUBUNGI KAMI</a></li>
              <li><a href="#" className="text-white hover:text-[#FF0080] font-bold text-sm uppercase transition-colors">KEBIJAKAN REFUND</a></li>
              <li><a href="#" className="text-white hover:text-[#FF0080] font-bold text-sm uppercase transition-colors">SYARAT & KETENTUAN</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-white uppercase">SOSIAL MEDIA</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white hover:text-[#FFD700] font-bold text-sm uppercase transition-colors">INSTAGRAM</a></li>
              <li><a href="#" className="text-white hover:text-[#FFD700] font-bold text-sm uppercase transition-colors">TIKTOK</a></li>
              <li><a href="#" className="text-white hover:text-[#FFD700] font-bold text-sm uppercase transition-colors">YOUTUBE</a></li>
              <li><a href="#" className="text-white hover:text-[#FFD700] font-bold text-sm uppercase transition-colors">WHATSAPP</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t-4 border-white mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white font-black text-sm uppercase">
              © 2025 PESTAPORA - BOSS CREATOR. FESTIVAL MUSIK TERBESAR INDONESIA.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-white hover:text-[#00FF00] font-bold text-sm uppercase transition-colors">PRIVASI</a>
              <a href="#" className="text-white hover:text-[#00FF00] font-bold text-sm uppercase transition-colors">COOKIES</a>
              <a href="#" className="text-white hover:text-[#00FF00] font-bold text-sm uppercase transition-colors">AKSESIBILITAS</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};