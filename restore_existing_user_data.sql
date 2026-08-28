-- ==============================================================================
-- RESTAURACIÓN INMEDIATA DE DATOS HUÉRFANOS (VINCULACIÓN A TU USUARIO)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Asigna todos los clientes, préstamos, cuotas y caja existentes a tu usuario registrado,
-- haciendo que aparezcan inmediatamente en la aplicación.

DO $$
DECLARE
    target_user_id UUID;
    v_clients_count INT;
    v_loans_count INT;
BEGIN
    -- 1. Obtener el ID de tu usuario registrado (el primero registrado en auth.users)
    SELECT id INTO target_user_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario en auth.users. Regístrate o inicia sesión al menos una vez.';
    END IF;

    -- 2. Asignar todos los registros huérfanos a tu usuario
    UPDATE public.clients SET user_id = target_user_id WHERE user_id IS NULL;
    GET DIAGNOSTICS v_clients_count = ROW_COUNT;

    UPDATE public.loans SET user_id = target_user_id WHERE user_id IS NULL;
    GET DIAGNOSTICS v_loans_count = ROW_COUNT;

    UPDATE public.installments SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE public.transactions SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE public.capital_box SET user_id = target_user_id WHERE user_id IS NULL;

    -- 3. Crear o renovar la suscripción VIP / PRO para tu usuario
    INSERT INTO public.user_subscriptions (user_id, tier, status, trial_ends_at)
    VALUES (target_user_id, 'pro', 'active', now() + INTERVAL '365 days')
    ON CONFLICT (user_id) DO UPDATE SET tier = 'pro', status = 'active';

    RAISE NOTICE '¡Listo! Se vincularon % clientes y % préstamos al usuario con ID: %', 
        v_clients_count, v_loans_count, target_user_id;
END $$;
