import { Event } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'PESTAPORA 2025 - HARI PERTAMA',
    description: 'PERAYAAN MUSIK INDONESIA HARI PERTAMA DENGAN RATUSAN ARTIS TERBAIK. SELEBRASI KEBAHAGIAAN YANG TAK TERLUPAKAN.',
    date: new Date('2025-09-05'),
    time: '15:00',
    venue: 'JAKARTA INTERNATIONAL EXPO',
    address: 'KEMAYORAN, JAKARTA PUSAT',
    category: 'MUSIC',
    image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    organizer: 'BOSS CREATOR',
    isFeatured: true,
    tags: ['MUSIK', 'FESTIVAL', 'INDONESIA'],
    totalSeats: 50000,
    bookedSeats: ['A1', 'A2', 'B5'],
    ticketTypes: [
      {
        id: '1-regular',
        name: 'TIKET REGULER',
        price: 350000,
        description: 'AKSES PENUH KE SEMUA PANGGUNG UTAMA',
        maxQuantity: 5,
        available: 30000,
        color: '#00FF00'
      },
      {
        id: '1-vip',
        name: 'VIP EXPERIENCE',
        price: 750000,
        description: 'AKSES VIP + MEET & GREET ARTIS',
        maxQuantity: 2,
        available: 5000,
        color: '#FF0080'
      },
      {
        id: '1-early',
        name: 'EARLY BIRD',
        price: 250000,
        description: 'HARGA SPESIAL UNTUK PEMBELIAN AWAL',
        maxQuantity: 3,
        available: 10000,
        color: '#00FFFF'
      }
    ]
  },
  {
    id: '2',
    title: 'PESTAPORA 2025 - HARI KEDUA',
    description: 'HARI KEDUA FESTIVAL MUSIK TERBESAR INDONESIA DENGAN LINEUP ARTIS INTERNASIONAL DAN LOKAL TERBAIK.',
    date: new Date('2025-09-06'),
    time: '14:00',
    venue: 'JAKARTA INTERNATIONAL EXPO',
    address: 'KEMAYORAN, JAKARTA PUSAT',
    category: 'MUSIC',
    image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    organizer: 'BOSS CREATOR',
    isFeatured: true,
    tags: ['MUSIK', 'FESTIVAL', 'INTERNASIONAL'],
    totalSeats: 50000,
    bookedSeats: ['C1', 'C2'],
    ticketTypes: [
      {
        id: '2-pit',
        name: 'GOLDEN CIRCLE',
        price: 500000,
        description: 'AREA TERDEPAN - AKSES EKSKLUSIF KE PANGGUNG UTAMA',
        maxQuantity: 4,
        available: 2000,
        color: '#FF0000'
      },
      {
        id: '2-general',
        name: 'TIKET REGULER',
        price: 350000,
        description: 'AKSES UMUM KE SEMUA AREA FESTIVAL',
        maxQuantity: 6,
        available: 35000,
        color: '#00FF00'
      }
    ]
  },
  {
    id: '3',
    title: 'PESTAPORA 2025 - HARI KETIGA',
    description: 'PENUTUPAN SPEKTAKULER FESTIVAL MUSIK 3 HARI DENGAN HEADLINER INTERNASIONAL DAN SURPRISE GUEST.',
    date: new Date('2025-09-07'),
    time: '16:00',
    venue: 'JAKARTA INTERNATIONAL EXPO',
    address: 'KEMAYORAN, JAKARTA PUSAT',
    category: 'MUSIC',
    image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    organizer: 'BOSS CREATOR',
    isFeatured: true,
    tags: ['MUSIK', 'FESTIVAL', 'CLOSING'],
    totalSeats: 50000,
    bookedSeats: ['D1'],
    ticketTypes: [
      {
        id: '3-regular',
        name: 'TIKET REGULER',
        price: 400000,
        description: 'AKSES PENUH KE PENUTUPAN SPEKTAKULER',
        maxQuantity: 3,
        available: 30000,
        color: '#00FFFF'
      },
      {
        id: '3-investor',
        name: 'VIP CLOSING',
        price: 800000,
        description: 'AKSES VIP + AFTER PARTY EKSKLUSIF',
        maxQuantity: 1,
        available: 3000,
        color: '#FF0080'
      }
    ]
  },
  {
    id: '4',
    title: 'KONSER MUSIK TRADISIONAL NUSANTARA',
    description: 'PERAYAAN KEKAYAAN MUSIK TRADISIONAL INDONESIA DENGAN KOLABORASI ARTIS MODERN DAN TRADISIONAL.',
    date: new Date('2025-08-15'),
    time: '19:00',
    venue: 'TAMAN MINI INDONESIA INDAH',
    address: 'JAKARTA TIMUR, DKI JAKARTA',
    category: 'MUSIC',
    image: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg',
    organizer: 'BOSS CREATOR',
    isFeatured: false,
    tags: ['MUSIK', 'TRADISIONAL', 'NUSANTARA'],
    totalSeats: 15000,
    bookedSeats: ['E1', 'E2', 'F5'],
    ticketTypes: [
      {
        id: '4-spectator',
        name: 'TIKET REGULER',
        price: 150000,
        description: 'AKSES KE KONSER MUSIK TRADISIONAL',
        maxQuantity: 10,
        available: 12000,
        color: '#00FF00'
      },
      {
        id: '4-player',
        name: 'TIKET PREMIUM',
        price: 300000,
        description: 'TEMPAT DUDUK TERBAIK + WORKSHOP MUSIK',
        maxQuantity: 1,
        available: 2000,
        color: '#FF0080'
      },
      {
        id: '4-vip',
        name: 'VIP CULTURAL',
        price: 500000,
        description: 'AKSES VIP + MEET ARTIS + MERCHANDISE',
        maxQuantity: 2,
        available: 500,
        color: '#00FFFF'
      }
    ]
  },
  {
    id: '5',
    title: 'ART EXHIBITION',
    description: 'RAW ART WITH SHARP EDGES. NO SMOOTH CURVES, NO GENTLE COLORS. ONLY INTENSE ARTISTIC EXPRESSION.',
    date: new Date('2024-04-20'),
    time: '18:00',
    venue: 'CONCRETE GALLERY',
    address: '101 BRUTAL ART STREET, DESIGN DISTRICT',
    category: 'ART',
    image: 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg',
    organizer: 'BRUTAL ART COLLECTIVE',
    isFeatured: false,
    tags: ['ART', 'EXHIBITION', 'BRUTALIST'],
    totalSeats: 200,
    bookedSeats: ['A10', 'B11'],
    ticketTypes: [
      {
        id: '5-regular',
        name: 'GALLERY ACCESS',
        price: 15,
        description: 'FULL EXHIBITION ACCESS',
        maxQuantity: 4,
        available: 150,
        color: '#00FF00'
      },
      {
        id: '5-artist',
        name: 'ARTIST MEET & GREET',
        price: 50,
        description: 'MEET THE BRUTAL ARTISTS',
        maxQuantity: 2,
        available: 25,
        color: '#00FFFF'
      }
    ]
  }
];