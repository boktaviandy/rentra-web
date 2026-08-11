-- =============================================================================
-- Migration: 007_seed_plans.sql
-- Description: Seed initial SaaS plans and EAV feature quotas
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Seed Plans
INSERT INTO plans (id, name, price_monthly, price_yearly, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Basic', 299000.00, 2990000.00, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Pro', 599000.00, 5990000.00, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Enterprise', 1299000.00, 12990000.00, TRUE)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly;

-- Seed EAV Plan Features
INSERT INTO plan_features (plan_id, feature_key, feature_value) VALUES
  -- Basic Plan Quotas
  ('11111111-1111-1111-1111-111111111111', 'max_cars', '15'),
  ('11111111-1111-1111-1111-111111111111', 'max_users', '5'),
  ('11111111-1111-1111-1111-111111111111', 'audit_log', 'false'),
  ('11111111-1111-1111-1111-111111111111', 'whatsapp_gateway', 'false'),

  -- Pro Plan Quotas
  ('22222222-2222-2222-2222-222222222222', 'max_cars', '50'),
  ('22222222-2222-2222-2222-222222222222', 'max_users', '15'),
  ('22222222-2222-2222-2222-222222222222', 'audit_log', 'true'),
  ('22222222-2222-2222-2222-222222222222', 'whatsapp_gateway', 'true'),

  -- Enterprise Plan Quotas
  ('33333333-3333-3333-3333-333333333333', 'max_cars', '-1'), -- Unlimited
  ('33333333-3333-3333-3333-333333333333', 'max_users', '-1'), -- Unlimited
  ('33333333-3333-3333-3333-333333333333', 'audit_log', 'true'),
  ('33333333-3333-3333-3333-333333333333', 'whatsapp_gateway', 'true')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
  feature_value = EXCLUDED.feature_value;
