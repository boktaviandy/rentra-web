-- ==============================================================================
-- RENTRA - Standalone Rental Car Management Database Schema
-- Compatible with PostgreSQL & Supabase
-- IMPORTANT: Column names are quoted to preserve camelCase for React compatibility
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- DROP EXISTING TABLES (untuk clean install / re-run schema)
-- CATATAN: Tabel users & settings TIDAK dihapus agar akun & pengaturan tidak hilang
-- Hapus dari bawah ke atas mengikuti urutan foreign key dependency
-- ==============================================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS pengeluaran CASCADE;
DROP TABLE IF EXISTS pemasukan CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS mobil CASCADE;

-- 2. SETTINGS (Profil Bisnis Rental - Single Record)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1 CONSTRAINT single_row CHECK (id = 1),
    "namaRental" VARCHAR(255) NOT NULL DEFAULT 'Garuda Rent Car',
    "namaOwner" VARCHAR(255) DEFAULT 'Budi Pratama',
    "noHp" VARCHAR(50) DEFAULT '0812-9900-1122',
    email VARCHAR(255) DEFAULT 'owner@garudarent.com',
    alamat TEXT DEFAULT 'Jl. Sudirman No. 100, Jakarta Selatan',
    "zonaWaktu" VARCHAR(100) DEFAULT 'Asia/Jakarta (WIB)',
    "mataUang" VARCHAR(50) DEFAULT 'IDR (Rp)',
    logo TEXT DEFAULT '',
    "namaBank" VARCHAR(100) DEFAULT 'BCA',
    "nomorRekening" VARCHAR(100) DEFAULT '123-456-7890',
    "atasNamaRekening" VARCHAR(255) DEFAULT 'Garuda Rent Car',
    "instruksiPembayaran" TEXT DEFAULT 'Mendukung Transfer Bank BCA, Mandiri, QRIS & Tunai',
    "syaratKetentuan" TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Settings jika belum ada
INSERT INTO settings (id, "namaRental", "namaOwner", "noHp", email, alamat)
VALUES (1, 'Garuda Rent Car', 'Budi Pratama', '0812-9900-1122', 'owner@garudarent.com', 'Jl. Sudirman No. 100, Jakarta Selatan')
ON CONFLICT (id) DO NOTHING;

-- 3. USERS (Akun Admin / Owner Pengelola Rental)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'owner',
    "noHp" VARCHAR(50),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON public.users (LOWER(username));

-- Drop legacy authentication function if it exists
DROP FUNCTION IF EXISTS authenticate_user(text, text);

-- Helper function to resolve username to email safely for login without exposing sensitive user profile data
CREATE OR REPLACE FUNCTION resolve_login_username(p_username TEXT)
RETURNS TABLE(email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.email
  FROM public.users u
  WHERE LOWER(u.username) = LOWER(TRIM(p_username))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION resolve_login_username TO anon;
GRANT EXECUTE ON FUNCTION resolve_login_username TO authenticated;

-- 4. MOBIL (Data Fleet / Armada Mobil Rental)
CREATE TABLE IF NOT EXISTS mobil (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    plat VARCHAR(50) UNIQUE NOT NULL,
    merk VARCHAR(100),
    tahun INTEGER,
    "hargaHarian" NUMERIC(15, 2) NOT NULL DEFAULT 0,
    "hargaMingguan" NUMERIC(15, 2) DEFAULT 0,
    "hargaBulanan" NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Tersedia',
    foto TEXT DEFAULT '',
    "fotoId" VARCHAR(255) DEFAULT '',
    catatan TEXT DEFAULT '',
    "totalHariDisewa" INTEGER DEFAULT 0,
    "totalPendapatan" NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CUSTOMERS (Data Penyewa Mobil)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    "noHp" VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    alamat TEXT,
    "noKtp" VARCHAR(50),
    "noSim" VARCHAR(50),
    "fotoKtp" TEXT DEFAULT '',
    "fotoSim" TEXT DEFAULT '',
    catatan TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'Aktif',
    "totalBooking" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. DRIVERS (Data Sopir Rental)
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    "noHp" VARCHAR(50) NOT NULL,
    sim VARCHAR(50),
    tarif NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Tersedia',
    foto TEXT DEFAULT '',
    catatan TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. BOOKINGS (Transaksi Penyewaan Mobil)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(100) PRIMARY KEY,
    "customerId" VARCHAR(100) REFERENCES customers(id) ON DELETE SET NULL,
    "customerNama" VARCHAR(255) NOT NULL,
    "mobilId" VARCHAR(100) REFERENCES mobil(id) ON DELETE SET NULL,
    "mobilNama" VARCHAR(255) NOT NULL,
    "mobilPlat" VARCHAR(50),
    "driverId" VARCHAR(100) REFERENCES drivers(id) ON DELETE SET NULL,
    "driverNama" VARCHAR(255),
    "tglMulai" DATE NOT NULL,
    "tglSelesai" DATE NOT NULL,
    harga NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deposit NUMERIC(15, 2) DEFAULT 0,
    "metodePembayaran" VARCHAR(50) DEFAULT 'Transfer Bank',
    status VARCHAR(50) NOT NULL DEFAULT 'Booking',
    "statusPembayaran" VARCHAR(50) DEFAULT 'Belum Bayar',
    catatan TEXT,
    "createdAt" DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. PEMASUKAN (Laporan Keuangan Pemasukan)
CREATE TABLE IF NOT EXISTS pemasukan (
    id VARCHAR(100) PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    kategori VARCHAR(100) NOT NULL DEFAULT 'Sewa Mobil',
    "bookingId" VARCHAR(100) REFERENCES bookings(id) ON DELETE SET NULL,
    nominal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    catatan TEXT,
    bukti TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. PENGELUARAN (Laporan Keuangan Pengeluaran)
CREATE TABLE IF NOT EXISTS pengeluaran (
    id VARCHAR(100) PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    kategori VARCHAR(100) NOT NULL DEFAULT 'Servis Mobil',
    "mobilId" VARCHAR(100) REFERENCES mobil(id) ON DELETE SET NULL,
    "mobilNama" VARCHAR(255) DEFAULT '',
    "bookingId" VARCHAR(100) REFERENCES bookings(id) ON DELETE SET NULL,
    nominal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    catatan TEXT,
    bukti TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. AUDIT LOGS (Catatan Aktivitas Operasional)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    aksi VARCHAR(100) NOT NULL,
    entitas VARCHAR(100) NOT NULL,
    rincian TEXT NOT NULL,
    "userNama" VARCHAR(255) DEFAULT 'Budi Pratama'
);

-- 11. VEHICLE_PHOTOS (Galeri Foto Armada Mobil & Storage Metadata)
CREATE TABLE IF NOT EXISTS vehicle_photos (
    id VARCHAR(100) PRIMARY KEY,
    "vehicle_id" VARCHAR(100) REFERENCES mobil(id) ON DELETE SET NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    title VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    "is_primary" BOOLEAN DEFAULT FALSE,
    tahun VARCHAR(50) DEFAULT '-',
    "originalSize" INTEGER DEFAULT 0,
    "compressedSize" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES UNTUK PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_mobil_status ON mobil(status);
CREATE INDEX IF NOT EXISTS idx_bookings_tgl ON bookings("tglMulai", "tglSelesai");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings("customerId");
CREATE INDEX IF NOT EXISTS idx_bookings_mobil ON bookings("mobilId");
CREATE INDEX IF NOT EXISTS idx_pemasukan_tgl ON pemasukan(tanggal);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tgl ON pengeluaran(tanggal);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON vehicle_photos("vehicle_id");
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_created_at ON vehicle_photos(created_at DESC);

-- ==============================================================================
-- AUTOMATIC TRIGGER UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';


CREATE OR REPLACE TRIGGER update_mobil_modtime BEFORE UPDATE ON mobil FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_drivers_modtime BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_bookings_modtime BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_settings_modtime BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_vehicle_photos_modtime BEFORE UPDATE ON vehicle_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & SECURITY POLICIES
-- Operational data is protected: anonymous users are denied access,
-- while authenticated users have full application operational access.
-- ==============================================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobil ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pemasukan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;

-- 1. SETTINGS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on settings" ON settings;
CREATE POLICY "Authenticated full access on settings" ON settings FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anon read access on settings" ON settings;
CREATE POLICY "Anon read access on settings" ON settings FOR SELECT TO anon USING (TRUE);

-- 2. USERS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on users" ON users;
CREATE POLICY "Authenticated full access on users" ON users FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 3. MOBIL POLICIES
DROP POLICY IF EXISTS "Authenticated full access on mobil" ON mobil;
DROP POLICY IF EXISTS "Full access on mobil" ON mobil;
CREATE POLICY "Full access on mobil" ON mobil FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- 4. CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on customers" ON customers;
CREATE POLICY "Authenticated full access on customers" ON customers FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 5. DRIVERS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on drivers" ON drivers;
CREATE POLICY "Authenticated full access on drivers" ON drivers FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 6. BOOKINGS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on bookings" ON bookings;
CREATE POLICY "Authenticated full access on bookings" ON bookings FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 7. PEMASUKAN POLICIES
DROP POLICY IF EXISTS "Authenticated full access on pemasukan" ON pemasukan;
CREATE POLICY "Authenticated full access on pemasukan" ON pemasukan FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 8. PENGELUARAN POLICIES
DROP POLICY IF EXISTS "Authenticated full access on pengeluaran" ON pengeluaran;
CREATE POLICY "Authenticated full access on pengeluaran" ON pengeluaran FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 9. AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on audit_logs" ON audit_logs;
CREATE POLICY "Authenticated full access on audit_logs" ON audit_logs FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 10. VEHICLE PHOTOS POLICIES
DROP POLICY IF EXISTS "Authenticated full access on vehicle_photos" ON vehicle_photos;
DROP POLICY IF EXISTS "Anon read access on vehicle_photos" ON vehicle_photos;
DROP POLICY IF EXISTS "Full access on vehicle_photos" ON vehicle_photos;
CREATE POLICY "Full access on vehicle_photos" ON vehicle_photos FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- ==============================================================================
-- GRANT PERMISSIONS
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobil TO anon;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- ==============================================================================
-- 12. SUPABASE STORAGE BUCKET & POLICIES (vehicle-photos)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read on vehicle-photos storage" ON storage.objects;
CREATE POLICY "Public Read on vehicle-photos storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'vehicle-photos');

DROP POLICY IF EXISTS "Public Insert on vehicle-photos storage" ON storage.objects;
CREATE POLICY "Public Insert on vehicle-photos storage" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'vehicle-photos');

DROP POLICY IF EXISTS "Public Update on vehicle-photos storage" ON storage.objects;
CREATE POLICY "Public Update on vehicle-photos storage" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'vehicle-photos');

DROP POLICY IF EXISTS "Public Delete on vehicle-photos storage" ON storage.objects;
CREATE POLICY "Public Delete on vehicle-photos storage" ON storage.objects FOR DELETE TO public USING (bucket_id = 'vehicle-photos');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
