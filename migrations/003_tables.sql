-- =============================================================================
-- Migration: 003_tables.sql
-- Description: Core 25 Production-Grade DDL Tables for Rentra SaaS
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PLANS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    price_monthly NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE plans IS 'Master SaaS subscription tier definitions (Basic, Pro, Enterprise)';

-- -----------------------------------------------------------------------------
-- 2. PLAN_FEATURES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_key)
);
COMMENT ON TABLE plan_features IS 'Extensible EAV feature flags and quotas per subscription plan';

-- -----------------------------------------------------------------------------
-- 3. TENANTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status tenant_status NOT NULL DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);
COMMENT ON TABLE tenants IS 'Primary SaaS tenant account metadata';

-- -----------------------------------------------------------------------------
-- 4. TENANT_SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    CONSTRAINT uq_tenant_setting UNIQUE (tenant_id, key)
);
COMMENT ON TABLE tenant_settings IS 'Extensible Key-Value store for tenant specific configurations (prefixes, footers, timezone)';

-- -----------------------------------------------------------------------------
-- 5. SUBSCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMPTZ NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE subscriptions IS 'Historical and active subscription billing records';

-- -----------------------------------------------------------------------------
-- 6. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
COMMENT ON TABLE users IS 'User profiles mirror mapping to Supabase auth.users';

-- -----------------------------------------------------------------------------
-- 7. TENANT_USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id)
);
COMMENT ON TABLE tenant_users IS 'Tenant membership and Role-Based Access Control (RBAC)';

-- -----------------------------------------------------------------------------
-- 8. DRIVER_DOCUMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    expired_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE driver_documents IS 'Document verification repository for drivers (SIM, KTP, SKCK)';

-- -----------------------------------------------------------------------------
-- 9. CAR_CATEGORIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT uq_tenant_category UNIQUE (tenant_id, name)
);
COMMENT ON TABLE car_categories IS 'Vehicle category classifications (SUV, MPV, Sedan)';

-- -----------------------------------------------------------------------------
-- 10. CARS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES car_categories(id) ON DELETE SET NULL,
    plate VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    color VARCHAR(50),
    transmission VARCHAR(50) NOT NULL DEFAULT 'Automatic',
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'Gasoline',
    seats INTEGER NOT NULL DEFAULT 5 CHECK (seats > 0),
    daily_rate NUMERIC(15, 2) NOT NULL CHECK (daily_rate >= 0),
    status car_status NOT NULL DEFAULT 'available',
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    CONSTRAINT uq_tenant_car_plate UNIQUE (tenant_id, plate)
);
COMMENT ON TABLE cars IS 'Fleet inventory master table';

-- -----------------------------------------------------------------------------
-- 11. CAR_MAINTENANCES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    odometer INTEGER CHECK (odometer >= 0),
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    vendor VARCHAR(150),
    description TEXT,
    next_service_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE car_maintenances IS 'Fleet maintenance and service history tracking';

-- -----------------------------------------------------------------------------
-- 12. CUSTOMERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    nik VARCHAR(30),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);
COMMENT ON TABLE customers IS 'Customer registry per tenant';

-- -----------------------------------------------------------------------------
-- 13. CUSTOMER_DOCUMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    expired_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE customer_documents IS 'Verification documents vault for customers (KTP, SIM, Passport)';

-- -----------------------------------------------------------------------------
-- 14. BOOKINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    booking_number VARCHAR(50) NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    daily_rate_snapshot NUMERIC(15, 2) NOT NULL CHECK (daily_rate_snapshot >= 0),
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    deposit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_amount >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    notes TEXT,
    car_name_snapshot VARCHAR(150) NOT NULL,
    plate_snapshot VARCHAR(20) NOT NULL,
    customer_name_snapshot VARCHAR(150) NOT NULL,
    customer_phone_snapshot VARCHAR(30) NOT NULL,
    customer_nik_snapshot VARCHAR(30),
    with_driver BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    CONSTRAINT chk_booking_dates CHECK (end_date > start_date),
    CONSTRAINT uq_tenant_booking_number UNIQUE (tenant_id, booking_number)
);
COMMENT ON TABLE bookings IS 'Master rental transaction records with immutable snapshots';

-- -----------------------------------------------------------------------------
-- 15. BOOKING_STATUS_HISTORIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_status_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status booking_status,
    new_status booking_status NOT NULL,
    notes TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID
);
COMMENT ON TABLE booking_status_histories IS 'Audit log of booking status transitions';

-- -----------------------------------------------------------------------------
-- 16. BOOKING_DRIVERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    driver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID
);
COMMENT ON TABLE booking_drivers IS 'Driver assignments and shift transition history per booking';

-- -----------------------------------------------------------------------------
-- 17. CAR_DAMAGES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_damages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    repair_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (repair_cost >= 0),
    deducted_from_deposit BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE car_damages IS 'Vehicle damage claims and deposit deduction records';

-- -----------------------------------------------------------------------------
-- 18. INVOICE_SEQUENCES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0),
    CONSTRAINT uq_invoice_seq UNIQUE (tenant_id, year, month)
);
COMMENT ON TABLE invoice_sequences IS 'Atomic counter for monthly invoice number generation per tenant';

-- -----------------------------------------------------------------------------
-- 19. INVOICES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    status invoice_status NOT NULL DEFAULT 'unpaid',
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    deposit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    amount_due NUMERIC(15, 2) NOT NULL CHECK (amount_due >= 0),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uq_tenant_invoice_number UNIQUE (tenant_id, invoice_number)
);
COMMENT ON TABLE invoices IS 'Tax and financial invoice master records';

-- -----------------------------------------------------------------------------
-- 20. PAYMENT_METHODS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE payment_methods IS 'Master table for system and tenant-specific payment channels';

-- -----------------------------------------------------------------------------
-- 21. PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    payment_type payment_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    notes TEXT,
    proof_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE payments IS 'Transaction ledger entries (DP, Pelunasan, Refund)';

-- -----------------------------------------------------------------------------
-- 22. EXPENSE_CATEGORIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE expense_categories IS 'Master category classification for operational expenditure';

-- -----------------------------------------------------------------------------
-- 23. EXPENSES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
COMMENT ON TABLE expenses IS 'Operational expenses ledger';

-- -----------------------------------------------------------------------------
-- 24. NOTIFICATION_TEMPLATES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    title_template VARCHAR(200) NOT NULL,
    body_template TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE notification_templates IS 'Notification message templates for automated messaging';

-- -----------------------------------------------------------------------------
-- 25. NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    entity VARCHAR(50),
    entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE notifications IS 'User in-app notifications inbox';

-- -----------------------------------------------------------------------------
-- 26. ACTIVITY_LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE activity_logs IS 'Audit trail logging all system actions, IP, User-Agent, and payload diffs';

-- -----------------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cars_updated_at BEFORE UPDATE ON cars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
