-- ==========================================
-- ESQUEMA DE BASE DE DATOS PARA PRESTALO
-- ==========================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Crea las tablas, relaciones, índices y políticas abiertas para la PWA.

-- 1. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    document_id TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
);

-- 2. TABLA DE PRÉSTAMOS
CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    capital NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    total_to_pay NUMERIC NOT NULL,
    payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    installments_count INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'overdue'))
);

-- 3. TABLA DE CUOTAS / AMORTIZACIONES
CREATE TABLE IF NOT EXISTS installments (
    id TEXT PRIMARY KEY,
    loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    number INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    capital_amount NUMERIC NOT NULL,
    interest_amount NUMERIC NOT NULL,
    due_date TEXT NOT NULL,
    paid_date TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue'))
);

-- 4. TABLA DE CAJA DE CAPITAL (SINGLETON)
CREATE TABLE IF NOT EXISTS capital_box (
    id TEXT PRIMARY KEY DEFAULT 'main_box',
    initial_capital NUMERIC NOT NULL,
    current_capital NUMERIC NOT NULL,
    total_lent NUMERIC NOT NULL,
    total_recovered NUMERIC NOT NULL,
    total_interest_recovered NUMERIC NOT NULL
);

-- 5. TABLA DE TRANSACCIONES FINANCIERAS
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'initial', 'loan_disbursement', 'installment_payment')),
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    reference_id TEXT
);

-- ==========================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_client_id ON installments(client_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================
-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_box ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Crear políticas públicas (Anon Key) para permitir sincronización Offline-First
-- Nota: En la siguiente fase de seguridad se pueden restringir por auth.uid()
CREATE POLICY "Permitir acceso público a clientes" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso público a préstamos" ON loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso público a cuotas" ON installments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso público a caja" ON capital_box FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso público a transacciones" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- DATOS INICIALES DE CAJA
-- ==========================================
INSERT INTO capital_box (id, initial_capital, current_capital, total_lent, total_recovered, total_interest_recovered)
VALUES ('main_box', 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;
