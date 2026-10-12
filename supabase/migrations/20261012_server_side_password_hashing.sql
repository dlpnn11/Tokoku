-- ==============================================================================
-- TOKOKU POS — SERVER-SIDE PASSWORD HASHING & SECURE AUTHENTICATION MIGRATION
-- Migration: 20261012_server_side_password_hashing.sql
-- ==============================================================================

-- 1. ENABLE CRYPTOGRAPHIC EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HASH EXISTING USERS IN THE DATABASE TO BCRYPT IF NOT ALREADY HASHED
UPDATE users
SET password_hash = crypt(password_hash, gen_salt('bf', 10))
WHERE password_hash NOT LIKE '$2a$%' AND password_hash NOT LIKE '$2b$%';

-- 3. CREATE SECURE AUTHENTICATION STORED FUNCTION (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Username atau password yang Anda masukkan salah.'
        );
    END IF;

    -- Compare password using bcrypt crypt function or legacy match with auto-upgrade
    IF v_user.password_hash = crypt(v_clean_pass, v_user.password_hash) THEN
        v_is_valid := true;
    ELSIF v_user.password_hash = v_clean_pass THEN
        -- If legacy plain-text password matched, automatically upgrade to bcrypt
        UPDATE users
        SET password_hash = crypt(v_clean_pass, gen_salt('bf', 10))
        WHERE id = v_user.id;
        v_is_valid := true;
    END IF;

    IF v_is_valid THEN
        -- Return user info WITHOUT password_hash!
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

-- 4. RESTRICT COLUMN PERMISSIONS TO PREVENT LEAKING password_hash VIA PUBLIC CLIENT SELECT
REVOKE SELECT ON users FROM anon, authenticated;
GRANT SELECT (id, username, full_name, role, created_at) ON users TO anon, authenticated;
