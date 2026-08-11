-- =============================================================================
-- Migration: 008_seed_masters.sql
-- Description: Seed global default payment methods, expense categories, notification templates
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Global Payment Methods (tenant_id IS NULL)
INSERT INTO payment_methods (id, tenant_id, name, type, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', NULL, 'Tunai (Cash)', 'cash', TRUE),
  ('a2222222-2222-2222-2222-222222222222', NULL, 'Transfer Bank', 'bank_transfer', TRUE),
  ('a3333333-3333-3333-3333-333333333333', NULL, 'QRIS', 'qris', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Global Expense Categories (tenant_id IS NULL)
INSERT INTO expense_categories (id, tenant_id, name, description, is_active) VALUES
  ('b1111111-1111-1111-1111-111111111111', NULL, 'BBM / Bahan Bakar', 'Biaya pengisian bensin armada', TRUE),
  ('b2222222-2222-2222-2222-222222222222', NULL, 'Servis & Perawatan', 'Biaya ganti oli, servis berkala, perbaikan', TRUE),
  ('b3333333-3333-3333-3333-333333333333', NULL, 'Cuci Mobil', 'Biaya kebersihan dan salon mobil', TRUE),
  ('b4444444-4444-4444-4444-444444444444', NULL, 'Honor Driver', 'Gaji dan komisi supir harian', TRUE),
  ('b5555555-5555-5555-5555-555555555555', NULL, 'Pajak & STNK', 'Biaya perpanjangan STNK dan pajak armada', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Global Notification Templates
INSERT INTO notification_templates (id, tenant_id, code, title_template, body_template, channel) VALUES
  ('c1111111-1111-1111-1111-111111111111', NULL, 'BOOKING_CONFIRMED', 'Reservasi Disetujui #{booking_number}', 'Halo {customer_name}, pesanan mobil {car_name} tanggal {start_date} telah dikonfirmasi.', 'whatsapp'),
  ('c2222222-2222-2222-2222-222222222222', NULL, 'RETURN_REMINDER', 'Peringatan Pengembalian #{booking_number}', 'Halo {customer_name}, pengembalian mobil {car_name} dijadwalkan hari ini jam {end_time}.', 'whatsapp')
ON CONFLICT (id) DO NOTHING;
