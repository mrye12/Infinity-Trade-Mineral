-- =====================================================
-- FIX: Create user profile manually
-- User ID: e7d9c765-0c29-43ae-9390-843c45f987fd
-- =====================================================

-- Insert user profile using known user ID
INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    full_name,
    role,
    department,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'e7d9c765-0c29-43ae-9390-843c45f987fd',
    'ilhamyahyaaji@infinitytrademineral.id',
    'Ilham Yahya Aji (SuperAdmin)',
    'admin',
    'Management',
    NOW(),
    NOW()
);

-- Verify creation
SELECT 
    '✅ USER PROFILE CREATED!' as status,
    id,
    email,
    full_name,
    role,
    department,
    auth_user_id
FROM public.users 
WHERE email = 'ilhamyahyaaji@infinitytrademineral.id';

-- Check total users now
SELECT 
    'TOTAL USERS NOW' as info,
    COUNT(*) as total_users
FROM public.users;
