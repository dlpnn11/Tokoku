-- ==============================================================================
-- TOKOKU POS — TIMING ATTACK MITIGATION ON AUTHENTICATION
-- Migration: 20261012_timing_attack_mitigation.sql
-- ==============================================================================

-- 1. UPDATE AUTHENTICATE_USER STORED FUNCTION TO PREVENT USER ENUMERATION VIA TIMING ATTACKS
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user RECORD;
    v_clean_user TEXT;
    v_clean_pass TEXT;
    v_is_valid BOOLEAN := false;
BEGIN
    v_clean_user := lower(trim(p_username));
    v_clean_pass := trim(p_password);

    -- Find user by lowercase username
    SELECT id, username, password_hash, full_name, role, created_at
    INTO v_user
    FROM users
    WHERE lower(username) = v_clean_user;

    IF NOT FOUND THEN
        -- Constant-time dummy bcrypt calculation to prevent username enumeration via timing analysis
        -- Uses extensions.crypt with a valid bcrypt hash format so that nonexistent users take identical CPU cycles (~80ms)
        PERFORM extensions.crypt(v_clean_pass, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Username atau password yang Anda masukkan salah.'
        );
    END IF;

    -- Compare password using bcrypt crypt function or legacy match with auto-upgrade
    IF v_user.password_hash = extensions.crypt(v_clean_pass, v_user.password_hash) THEN
        v_is_valid := true;
    ELSIF v_user.password_hash = v_clean_pass THEN
        -- If legacy plain-text password matched, automatically upgrade to bcrypt
        UPDATE users
        SET password_hash = extensions.crypt(v_clean_pass, extensions.gen_salt('bf', 10))
        WHERE id = v_user.id;
        v_is_valid := true;
    END IF;

    IF v_is_valid THEN
        -- Return user info WITHOUT password_hash
        RETURN jsonb_build_object(
            'success', true,
            'user', jsonb_build_object(
                'id', v_user.id,
                'username', v_user.username,
                'full_name', v_user.full_name,
                'role', v_user.role,
                'created_at', v_user.created_at
            )
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Username atau password yang Anda masukkan salah.'
        );
    END IF;
END;
$$;
