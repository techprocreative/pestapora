-- Insert sample organizers
INSERT INTO organizers (id, name, slug, owner_user_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'PESTAPORA', 'pestapora', '550e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Jakarta Music Festival', 'jakarta-music-festival', '550e8400-e29b-41d4-a716-446655440000'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bali Arts Collective', 'bali-arts-collective', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample events
INSERT INTO events (id, organizer_id, title, description, starts_at, ends_at, venue, address, status, image_url, capacity, is_featured, tags) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    'Jakarta Music Festival 2024',
    'Festival musik terbesar di Jakarta dengan lineup artis internasional dan lokal terbaik. Nikmati pengalaman musik yang tak terlupakan di venue outdoor yang spektakuler.',
    '2024-12-15 18:00:00+07',
    '2024-12-15 23:00:00+07',
    'Gelora Bung Karno Stadium',
    'Jl. Pintu Satu Senayan, Jakarta Pusat, DKI Jakarta 10270',
    'published',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    50000,
    true,
    ARRAY['music', 'festival', 'outdoor']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440002',
    'Stand-up Comedy Night',
    'Malam komedi dengan komedian terbaik Indonesia. Bersiaplah untuk tertawa lepas sepanjang malam!',
    '2024-11-20 20:00:00+07',
    '2024-11-20 22:30:00+07',
    'Balai Sarbini',
    'Jl. Sisingamangaraja No.73, Selong, Kec. Kby. Baru, Jakarta Selatan',
    'published',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    500,
    false,
    ARRAY['comedy', 'entertainment', 'indoor']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440003',
    'Bali Food & Culture Festival',
    'Festival kuliner dan budaya Bali dengan berbagai makanan tradisional, pertunjukan seni, dan workshop budaya.',
    '2024-12-01 10:00:00+08',
    '2024-12-03 22:00:00+08',
    'Bali Collection Nusa Dua',
    'BTDC Area, Nusa Dua, Benoa, South Kuta, Badung Regency, Bali',
    'published',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    2000,
    true,
    ARRAY['food', 'culture', 'festival', 'bali']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440001',
    'Tech Conference 2024',
    'Konferensi teknologi terdepan dengan pembicara dari perusahaan teknologi global. Pelajari tren terbaru dalam AI, blockchain, dan cloud computing.',
    '2024-11-25 09:00:00+07',
    '2024-11-25 17:00:00+07',
    'Jakarta Convention Center',
    'Jl. Gatot Subroto, Senayan, Jakarta Pusat, DKI Jakarta',
    'published',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    1000,
    false,
    ARRAY['technology', 'conference', 'business']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440002',
    'Sunset Jazz Concert',
    'Konser jazz di tepi pantai dengan pemandangan sunset yang menakjubkan. Nikmati musik jazz dari musisi terbaik Indonesia.',
    '2024-12-08 17:00:00+07',
    '2024-12-08 21:00:00+07',
    'Ancol Beach',
    'Jl. Lodan Timur No.7, Ancol, Pademangan, Jakarta Utara',
    'published',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    800,
    true,
    ARRAY['jazz', 'music', 'sunset', 'beach']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440003',
    'Art Exhibition: Modern Indonesia',
    'Pameran seni modern Indonesia menampilkan karya-karya seniman kontemporer terbaik. Jelajahi interpretasi modern budaya Indonesia.',
    '2024-11-30 10:00:00+07',
    '2024-12-10 18:00:00+07',
    'National Gallery Indonesia',
    'Jl. Medan Merdeka Timur No.14, Gambir, Jakarta Pusat',
    'published',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
    300,
    false,
    ARRAY['art', 'exhibition', 'culture', 'modern']
  );

-- Insert ticket types for each event
-- Jakarta Music Festival 2024
INSERT INTO ticket_types (id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'Early Bird', 'Tiket early bird dengan harga spesial', 75000000, 'IDR', 4, 1000, 850, '#10B981'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', 'Regular', 'Tiket reguler', 100000000, 'IDR', 4, 2000, 1500, '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010', 'VIP', 'Tiket VIP dengan akses khusus', 200000000, 'IDR', 2, 500, 400, '#F59E0B');

-- Stand-up Comedy Night
INSERT INTO ticket_types (id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440011', 'Regular', 'Tiket reguler', 15000000, 'IDR', 6, 400, 320, '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440011', 'Premium', 'Tiket premium dengan tempat duduk terdepan', 25000000, 'IDR', 4, 100, 75, '#F59E0B');

-- Bali Food & Culture Festival
INSERT INTO ticket_types (id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440012', 'Day Pass', 'Tiket harian (1 hari)', 5000000, 'IDR', 8, 600, 450, '#10B981'),
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440012', 'Weekend Pass', 'Tiket weekend (3 hari)', 12000000, 'IDR', 6, 400, 300, '#3B82F6');

-- Tech Conference 2024
INSERT INTO ticket_types (id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440013', 'Student', 'Tiket khusus mahasiswa', 10000000, 'IDR', 2, 200, 150, '#10B981'),
  ('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440013', 'Professional', 'Tiket profesional', 30000000, 'IDR', 4, 600, 480, '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440013', 'Corporate', 'Tiket korporat dengan networking session', 50000000, 'IDR', 10, 200, 180, '#F59E0B');

-- Sunset Jazz Concert
INSERT INTO ticket_types (id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440014', 'General Admission', 'Tiket umum', 20000000, 'IDR', 6, 600, 480, '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440014', 'VIP Table', 'Meja VIP untuk 4 orang', 30000000, 'IDR', 1, 50, 35, '#F59E0B');

-- Art Exhibition: Modern Indonesia
INSERT INTO ticket_types (id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440015', 'Regular', 'Tiket reguler', 2500000, 'IDR', 8, 250, 200, '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440015', 'Guided Tour', 'Tiket dengan tur berpemandu', 5000000, 'IDR', 4, 50, 40, '#F59E0B');