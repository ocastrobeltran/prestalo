-- ====================================================================
-- MIGRACIÓN SUPABASE: SOPORTE DE ABONOS PARCIALES, PACTOS Y PLAZO DE 1 MES
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Añade las columnas necesarias a la tabla 'installments' para persistir
-- el detalle exacto de abonos libres, pactos y fechas límites.

ALTER TABLE installments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS paid_capital_amount NUMERIC DEFAULT 0;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS paid_interest_amount NUMERIC DEFAULT 0;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS is_pactada BOOLEAN DEFAULT false;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS pact_date TEXT;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS pact_deadline TEXT;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS waived_amount NUMERIC DEFAULT 0;
