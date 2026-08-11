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
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255),
    role VARCHAR(50) DEFAULT 'owner',
    "noHp" VARCHAR(50),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin Account (selalu reset passwordHash ke admin123 agar tidak lockout)
INSERT INTO users (nama, email, "passwordHash", role)
VALUES ('Admin Rentra', 'admin@rentra.com', 'admin123', 'owner')
ON CONFLICT (email) DO UPDATE SET "passwordHash" = 'admin123', role = 'owner';

-- Fungsi Login (SECURITY DEFINER = bypass RLS, pakai hak postgres)
CREATE OR REPLACE FUNCTION authenticate_user(p_email TEXT, p_password TEXT)
RETURNS TABLE(id UUID, nama TEXT, email TEXT, role TEXT, "noHp" TEXT, avatar TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nama, u.email, u.role, u."noHp", u.avatar
  FROM users u
  WHERE u.email ILIKE p_email
    AND u."passwordHash" = p_password;
END;
$$;

GRANT EXECUTE ON FUNCTION authenticate_user TO anon;
GRANT EXECUTE ON FUNCTION authenticate_user TO authenticated;

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

-- ==============================================================================
-- DISABLE ROW LEVEL SECURITY (RLS)
-- Wajib dinonaktifkan agar anon key bisa membaca & menulis data
-- ==============================================================================
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mobil DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE pemasukan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- GRANT PERMISSIONS (agar anon/authenticated key bisa akses semua tabel)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
