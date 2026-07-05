-- =======================================================
-- ACTUALIZACIÓN DE SEGURIDAD (SUPABASE AUTH POLICIES)
-- =======================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Modifica las políticas RLS para permitir acceso exclusivo a usuarios autenticados.

-- 1. POLÍTICAS PARA LA TABLA 'clients'
DROP POLICY IF EXISTS "Permitir acceso público a clientes" ON clients;
CREATE POLICY "Permitir acceso solo a autenticados" ON clients
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. POLÍTICAS PARA LA TABLA 'loans'
DROP POLICY IF EXISTS "Permitir acceso público a préstamos" ON loans;
CREATE POLICY "Permitir acceso solo a autenticados" ON loans
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. POLÍTICAS PARA LA TABLA 'installments'
DROP POLICY IF EXISTS "Permitir acceso público a cuotas" ON installments;
CREATE POLICY "Permitir acceso solo a autenticados" ON installments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. POLÍTICAS PARA LA TABLA 'capital_box'
DROP POLICY IF EXISTS "Permitir acceso público a caja" ON capital_box;
CREATE POLICY "Permitir acceso solo a autenticados" ON capital_box
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. POLÍTICAS PARA LA TABLA 'transactions'
DROP POLICY IF EXISTS "Permitir acceso público a transacciones" ON transactions;
CREATE POLICY "Permitir acceso solo a autenticados" ON transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
