-- ==============================================================================
-- MIGRACIÓN MULTI-INQUILINO (MULTI-TENANT), AISLAMIENTO RLS Y SUSCRIPCIONES
-- PRESTALO APP (MIGRACIÓN SEGURA CON PRESERVACIÓN TOTAL DE DATOS)
-- ==============================================================================
-- Este script:
-- 1. Agrega soporte multi-usuario con 'user_id' a todas las tablas.
-- 2. Atribuye AUTOMÁTICAMENTE todos los datos existentes (clientes, préstamos,
--    cuotas, caja y transacciones) al usuario actual en pruebas, evitando que se pierda nada.
-- 3. Otorga al usuario actual 1 año de Membresía PRO activa como Early Adopter.
-- 4. Habilita RLS estricto para que futuros usuarios no vean sus datos.
-- 5. Activa el trigger automático para nuevos usuarios.

-- 1. TABLA DE SUSCRIPCIONES Y MEMBRESÍAS
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'canceled', 'past_due', 'expired')),
    trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ADICIÓN DE COLUMNA 'user_id' A TODAS LAS TABLAS EXISTENTES
DO $$ 
BEGIN 
    -- Clients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='user_id') THEN
        ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Loans
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='user_id') THEN
        ALTER TABLE loans ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Installments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='installments' AND column_name='user_id') THEN
        ALTER TABLE installments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='user_id') THEN
        ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Capital Box
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='capital_box' AND column_name='user_id') THEN
        ALTER TABLE capital_box ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. MIGRACIÓN Y ASIGNACIÓN DE DATOS PREVIOS AL USUARIO ACTUAL EN PRUEBAS
-- (Asigna todas las filas huérfanas al primer usuario registrado para que no desaparezca nada)
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    SELECT id INTO existing_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Asignar clientes, préstamos, cuotas y transacciones
        UPDATE public.clients SET user_id = existing_user_id WHERE user_id IS NULL;
        UPDATE public.loans SET user_id = existing_user_id WHERE user_id IS NULL;
        UPDATE public.installments SET user_id = existing_user_id WHERE user_id IS NULL;
        UPDATE public.transactions SET user_id = existing_user_id WHERE user_id IS NULL;
        UPDATE public.capital_box SET user_id = existing_user_id WHERE user_id IS NULL;

        -- Otorgar membresía PRO activa al usuario actual
        INSERT INTO public.user_subscriptions (user_id, tier, status, trial_ends_at, current_period_end)
        VALUES (existing_user_id, 'pro', 'active', now() + INTERVAL '365 days', now() + INTERVAL '365 days')
        ON CONFLICT (user_id) DO UPDATE SET tier = 'pro', status = 'active';
    END IF;
END $$;

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_user_id ON installments(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_box_user_id ON capital_box(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- 5. HABILITACIÓN DE RLS Y POLÍTICAS POR USUARIO
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_box ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas
DROP POLICY IF EXISTS "Permitir acceso público a clientes" ON clients;
DROP POLICY IF EXISTS "Permitir acceso solo a autenticados" ON clients;
DROP POLICY IF EXISTS "Users can only access their own clients" ON clients;

DROP POLICY IF EXISTS "Permitir acceso público a préstamos" ON loans;
DROP POLICY IF EXISTS "Permitir acceso solo a autenticados" ON loans;
DROP POLICY IF EXISTS "Users can only access their own loans" ON loans;

DROP POLICY IF EXISTS "Permitir acceso público a cuotas" ON installments;
DROP POLICY IF EXISTS "Permitir acceso solo a autenticados" ON installments;
DROP POLICY IF EXISTS "Users can only access their own installments" ON installments;

DROP POLICY IF EXISTS "Permitir acceso público a transacciones" ON transactions;
DROP POLICY IF EXISTS "Permitir acceso solo a autenticados" ON transactions;
DROP POLICY IF EXISTS "Users can only access their own transactions" ON transactions;

DROP POLICY IF EXISTS "Permitir acceso público a caja" ON capital_box;
DROP POLICY IF EXISTS "Permitir acceso solo a autenticados" ON capital_box;
DROP POLICY IF EXISTS "Users can only access their own capital box" ON capital_box;

DROP POLICY IF EXISTS "Users can only access their own subscription" ON user_subscriptions;

-- CREACIÓN DE POLÍTICAS AISLADAS
CREATE POLICY "Users can only access their own clients" ON clients
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own loans" ON loans
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own installments" ON installments
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own transactions" ON transactions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own capital box" ON capital_box
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own subscription" ON user_subscriptions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. FUNCIÓN Y TRIGGER PARA REGISTROS FUTUROS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear caja de capital inicial para el nuevo usuario
    INSERT INTO public.capital_box (id, user_id, initial_capital, current_capital, total_lent, total_recovered, total_interest_recovered)
    VALUES (gen_random_uuid()::text, NEW.id, 0, 0, 0, 0, 0)
    ON CONFLICT DO NOTHING;

    -- Crear suscripción de prueba de 30 días VIP
    INSERT INTO public.user_subscriptions (user_id, tier, status, trial_ends_at)
    VALUES (NEW.id, 'free', 'trialing', now() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. FUNCIÓN PARA ELIMINACIÓN DE CUENTA
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    DELETE FROM public.installments WHERE user_id = current_user_id;
    DELETE FROM public.loans WHERE user_id = current_user_id;
    DELETE FROM public.clients WHERE user_id = current_user_id;
    DELETE FROM public.transactions WHERE user_id = current_user_id;
    DELETE FROM public.capital_box WHERE user_id = current_user_id;
    DELETE FROM public.user_subscriptions WHERE user_id = current_user_id;

    DELETE FROM auth.users WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
