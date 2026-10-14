-- ==============================================================================
-- RESTABLECIMIENTO DE CAJA Y SANEAMIENTO DE PRÉSTAMO ELIMINADO PARA ALEX
-- Usuario: gonzalezcastro99@gmail.com
-- ==============================================================================
-- Este script:
-- 1. Identifica al usuario Alex por su correo electrónico.
-- 2. Elimina transacciones erróneas de tipo 'expense' generadas al eliminar préstamos.
-- 3. Elimina transacciones huérfanas de desembolso o pago cuyo reference_id no existe en loans.
-- 4. Recalcula con precisión matemática y actualiza la fila correspondiente en capital_box.
-- 5. Muestra una consulta de comprobación con el estado final de la caja y registros.

DO $$
DECLARE
    alex_user_id UUID;
    v_initial_capital NUMERIC := 0;
    v_total_disbursed NUMERIC := 0;
    v_total_recovered NUMERIC := 0;
    v_total_interest_recovered NUMERIC := 0;
    v_total_paid_amount NUMERIC := 0;
    v_total_lent NUMERIC := 0;
    v_manual_adjustments NUMERIC := 0;
    v_current_capital NUMERIC := 0;
    deleted_expense_count INTEGER := 0;
    deleted_orphan_count INTEGER := 0;
BEGIN
    -- 1. Buscar el usuario Alex por correo
    SELECT id INTO alex_user_id 
    FROM auth.users 
    WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com'
    LIMIT 1;

    IF alex_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario gonzalezcastro99@gmail.com en auth.users.';
    END IF;

    -- 2. Eliminar transacciones erróneas de tipo 'expense' relacionadas a eliminación de préstamo
    WITH deleted_exp AS (
        DELETE FROM public.transactions
        WHERE user_id = alex_user_id
          AND type = 'expense'
          AND (
              description ILIKE '%Eliminación de Préstamo%' 
              OR description ILIKE '%Eliminacion de Prestamo%' 
              OR description ILIKE '%Eliminacion de Pr%stamo%'
          )
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_expense_count FROM deleted_exp;

    -- 3. Eliminar transacciones huérfanas de desembolso o pago que apunten a préstamos inexistentes
    WITH deleted_orph AS (
        DELETE FROM public.transactions
        WHERE user_id = alex_user_id
          AND type IN ('loan_disbursement', 'installment_payment')
          AND (reference_id IS NULL OR reference_id NOT IN (SELECT id FROM public.loans WHERE user_id = alex_user_id))
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_orphan_count FROM deleted_orph;

    RAISE NOTICE 'Transacciones purgadas: % gastos erróneos por eliminación de préstamo, % desembolsos/pagos huérfanos.', 
        deleted_expense_count, deleted_orphan_count;

    -- 4. Obtener Capital Inicial registrado
    SELECT COALESCE(initial_capital, 0)
    INTO v_initial_capital
    FROM public.capital_box
    WHERE user_id = alex_user_id
    LIMIT 1;

    IF v_initial_capital IS NULL THEN
        v_initial_capital := 0;
    END IF;

    -- 5. Calcular Capital Total Desembolsado en préstamos existentes
    SELECT COALESCE(SUM(capital), 0)
    INTO v_total_disbursed
    FROM public.loans
    WHERE user_id = alex_user_id;

    -- 6. Calcular recaudos y préstamos pendientes desde cuotas
    SELECT
        COALESCE(SUM(COALESCE(paid_capital_amount, CASE WHEN status = 'paid' THEN capital_amount ELSE 0 END)), 0),
        COALESCE(SUM(COALESCE(paid_interest_amount, CASE WHEN status = 'paid' THEN interest_amount ELSE 0 END)), 0),
        COALESCE(SUM(
            COALESCE(paid_amount, 
                CASE 
                    WHEN status = 'paid' THEN amount 
                    ELSE (COALESCE(paid_capital_amount, 0) + COALESCE(paid_interest_amount, 0)) 
                END
            )
        ), 0),
        COALESCE(SUM(CASE WHEN status != 'paid' AND amount > 0 THEN capital_amount ELSE 0 END), 0)
    INTO
        v_total_recovered,
        v_total_interest_recovered,
        v_total_paid_amount,
        v_total_lent
    FROM public.installments
    WHERE user_id = alex_user_id;

    -- 7. Calcular ajustes manuales desde transacciones legítimas (ingresos, gastos reales, retiros)
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount
            WHEN type IN ('expense', 'profit_withdrawal') THEN -ABS(amount)
            ELSE 0 
        END
    ), 0)
    INTO v_manual_adjustments
    FROM public.transactions
    WHERE user_id = alex_user_id;

    -- 8. Calcular Capital Disponible Actual:
    -- currentCapital = initialCapital - totalDisbursed + totalPaidAmount + manualAdjustments
    v_current_capital := v_initial_capital - v_total_disbursed + v_total_paid_amount + v_manual_adjustments;

    -- 9. Actualizar o insertar capital_box
    IF EXISTS (SELECT 1 FROM public.capital_box WHERE user_id = alex_user_id) THEN
        UPDATE public.capital_box
        SET current_capital = v_current_capital,
            total_lent = v_total_lent,
            total_recovered = v_total_recovered,
            total_interest_recovered = v_total_interest_recovered
        WHERE user_id = alex_user_id;
    ELSE
        INSERT INTO public.capital_box (
            id, user_id, initial_capital, current_capital, total_lent, total_recovered, total_interest_recovered
        ) VALUES (
            'box_' || alex_user_id::text,
            alex_user_id,
            v_initial_capital,
            v_current_capital,
            v_total_lent,
            v_total_recovered,
            v_total_interest_recovered
        );
    END IF;

    RAISE NOTICE 'Caja de capital recalculada exitosamente: Capital Inicial = %, Disponible en Caja = %, En Calle = %', 
        v_initial_capital, v_current_capital, v_total_lent;
END $$;

-- ==============================================================================
-- 10. SELECT DE COMPROBACIÓN FINAL
-- ==============================================================================
SELECT 
    u.email AS usuario,
    cb.initial_capital AS capital_inicial,
    cb.current_capital AS capital_disponible_en_caja,
    cb.total_lent AS capital_en_calle,
    cb.total_recovered AS capital_recuperado,
    cb.total_interest_recovered AS intereses_recuperados,
    (SELECT COUNT(*) FROM public.loans WHERE user_id = u.id) AS total_prestamos_activos,
    (SELECT COUNT(*) FROM public.transactions WHERE user_id = u.id) AS total_transacciones_limpias
FROM public.capital_box cb
JOIN auth.users u ON u.id = cb.user_id
WHERE LOWER(TRIM(u.email)) = 'gonzalezcastro99@gmail.com';
