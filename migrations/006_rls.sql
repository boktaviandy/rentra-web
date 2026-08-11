-- =============================================================================
-- Migration: 006_rls.sql
-- Description: Supabase Row Level Security Policies (Multi-Tenant Isolation)
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Helper Function: Get current authenticated tenant ID from JWT metadata
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tenant-owned tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- CREATE RLS POLICIES (ISOLATED BY TENANT_ID)
-- -----------------------------------------------------------------------------
CREATE POLICY tenant_isolation_tenants ON tenants FOR ALL USING (id = current_tenant_id());
CREATE POLICY tenant_isolation_tenant_settings ON tenant_settings FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_tenant_users ON tenant_users FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_driver_documents ON driver_documents FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_car_categories ON car_categories FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_cars ON cars FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_car_maintenances ON car_maintenances FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_customers ON customers FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_customer_documents ON customer_documents FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_bookings ON bookings FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_booking_status_histories ON booking_status_histories FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_booking_drivers ON booking_drivers FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_car_damages ON car_damages FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_invoice_sequences ON invoice_sequences FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_invoices ON invoices FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_payment_methods ON payment_methods FOR ALL USING (tenant_id IS NULL OR tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_payments ON payments FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_expense_categories ON expense_categories FOR ALL USING (tenant_id IS NULL OR tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_expenses ON expenses FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_notification_templates ON notification_templates FOR ALL USING (tenant_id IS NULL OR tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_notifications ON notifications FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_activity_logs ON activity_logs FOR ALL USING (tenant_id = current_tenant_id());

-- Global Public Lookup Policies (Plans & Plan Features)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_plans ON plans FOR SELECT USING (is_active = TRUE);
CREATE POLICY public_read_plan_features ON plan_features FOR SELECT USING (TRUE);
