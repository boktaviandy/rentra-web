-- =============================================================================
-- Migration: 005_constraints.sql
-- Description: Business Integrity CHECK Constraints & Atomic Stored Procedure
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Atomic Stored Procedure: Generate Next Invoice Number per Tenant/Year/Month
CREATE OR REPLACE FUNCTION generate_next_invoice_number(
    p_tenant_id UUID,
    p_prefix VARCHAR DEFAULT 'INV'
)
RETURNS VARCHAR AS $$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
    v_last_num INTEGER;
    v_seq_str VARCHAR;
    v_invoice_num VARCHAR;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    v_month := EXTRACT(MONTH FROM CURRENT_TIMESTAMP);

    -- Atomic increment using UPSERT ... ON CONFLICT DO UPDATE
    INSERT INTO invoice_sequences (tenant_id, year, month, last_number)
    VALUES (p_tenant_id, v_year, v_month, 1)
    ON CONFLICT (tenant_id, year, month)
    DO UPDATE SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number INTO v_last_num;

    v_seq_str := LPAD(v_last_num::TEXT, 5, '0');
    v_invoice_num := p_prefix || '-' || v_year::TEXT || LPAD(v_month::TEXT, 2, '0') || '-' || v_seq_str;

    RETURN v_invoice_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_next_invoice_number(UUID, VARCHAR) IS 'Atomic generator function for monthly invoice sequences (Format: INV-YYYYMM-00001)';
