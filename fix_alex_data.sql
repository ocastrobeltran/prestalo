-- ==============================================================================
-- REASIGNACIÓN DEFINITIVA Y DIAGNÓSTICO PARA ALEX (gonzalezcastro99@gmail.com)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- 1. Reasigna TODOS los datos a Alex (sin importar a qué user_id estaban antes).
-- 2. Asegura compatibilidad tanto con la versión web previa como con la nueva.
-- 3. Muestra una tabla con el conteo exacto de registros.

DO $$
DECLARE
    alex_user_id UUID;
BEGIN
    -- 1. Buscar el ID exacto del usuario por su correo
    SELECT id INTO alex_user_id 
    FROM auth.users 
    WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com'
    LIMIT 1;

    IF alex_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario con el correo gonzalezcastro99@gmail.com en auth.users. Verifica que el usuario se haya registrado en Supabase Auth.';
    END IF;

    -- 2. REASIGNAR ABSOLUTAMENTE TODOS LOS REGISTROS A ALEX
    UPDATE public.clients SET user_id = alex_user_id;
    UPDATE public.loans SET user_id = alex_user_id;
    UPDATE public.installments SET user_id = alex_user_id;
    UPDATE public.transactions SET user_id = alex_user_id;
    
    -- Asegurar que la caja de capital esté vinculada a Alex y mantenga compatibilidad
    UPDATE public.capital_box SET user_id = alex_user_id;
    
    -- Si no existía capital_box, crearla
    IF NOT EXISTS (SELECT 1 FROM public.capital_box WHERE user_id = alex_user_id) THEN
        INSERT INTO public.capital_box (id, user_id, initial_capital, current_capital, total_lent, total_recovered, total_interest_recovered)
        VALUES ('main_box', alex_user_id, 0, 0, 0, 0, 0)
        ON CONFLICT DO NOTHING;
    END IF;

    -- 3. Asignar Suscripción PRO a Alex
    INSERT INTO public.user_subscriptions (user_id, tier, status, trial_ends_at)
    VALUES (alex_user_id, 'pro', 'active', now() + INTERVAL '365 days')
    ON CONFLICT (user_id) DO UPDATE SET tier = 'pro', status = 'active';

    RAISE NOTICE '¡Todos los datos han sido reasignados exitosamente a Alex (ID: %)!', alex_user_id;
END $$;

-- 4. VERIFICACIÓN Y CONTEO (Esto mostrará una tabla con los resultados en pantalla)
SELECT 
    (SELECT email FROM auth.users WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com') AS usuario,
    (SELECT COUNT(*) FROM public.clients WHERE user_id = (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com')) AS total_clientes,
    (SELECT COUNT(*) FROM public.loans WHERE user_id = (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com')) AS total_prestamos,
    (SELECT COUNT(*) FROM public.installments WHERE user_id = (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com')) AS total_cuotas,
    (SELECT COUNT(*) FROM public.transactions WHERE user_id = (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = 'gonzalezcastro99@gmail.com')) AS total_transacciones;
