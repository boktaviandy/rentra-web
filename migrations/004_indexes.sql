-- =============================================================================
-- Migration: 004_indexes.sql
-- Description: Production B-Tree, Composite, and Partial Indexes for Rentra SaaS
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Tenant isolation lookup indexes (Multi-tenant performance)
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_tenant_user ON driver_documents(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_car_categories_tenant ON car_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cars_tenant ON cars(tenant_id);
CREATE INDEX IF NOT EXISTS idx_car_maintenances_car ON car_maintenances(tenant_id, car_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_docs_customer ON customer_documents(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car ON bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_histories_booking ON booking_status_histories(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_drivers_booking ON booking_drivers(booking_id);
CREATE INDEX IF NOT EXISTS idx_car_damages_booking ON car_damages(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_cat ON expenses(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_car ON expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);

-- Date Range & Filtering Query Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(tenant_id, status);

-- Soft Delete Partial Indexes (Excludes soft-deleted rows from queries automatically)
CREATE INDEX IF NOT EXISTS idx_active_tenants ON tenants(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_users ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_cars ON cars(tenant_id, id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_customers ON customers(tenant_id, id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_bookings ON bookings(tenant_id, id) WHERE deleted_at IS NULL;

-- JSONB GIN Indexes for audit log payloads
CREATE INDEX IF NOT EXISTS idx_activity_logs_old_data ON activity_logs USING gin (old_data);
CREATE INDEX IF NOT EXISTS idx_activity_logs_new_data ON activity_logs USING gin (new_data);
