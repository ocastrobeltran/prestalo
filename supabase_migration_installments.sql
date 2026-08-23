-- ====================================================================
-- MIGRACION SUPABASE: SOPORTE DE ABONOS PARCIALES Y CUOTAS PACTADAS
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Anade las columnas necesarias a la tabla 'installments' para persistir
-- el detalle exacto de abonos parciales, pactos y condonaciones.

ALTER TABLE installments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS paid_capital_amount NUMERIC DEFAULT 0;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS paid_interest_amount NUMERIC DEFAULT 0;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS is_pactada BOOLEAN DEFAULT false;
ALTER TABLE installments ADD COLUMN IF NOT EXISTS waived_amount NUMERIC DEFAULT 0;
