-- ════════════════════════════════════════════════════════════════════
-- 010-admin-bootstrap.sql
-- Registra o primeiro Super Admin via e-mail
-- Execute DEPOIS de 010-admin-platform.sql
-- ════════════════════════════════════════════════════════════════════

-- Insere o super admin usando o UUID do auth.users pelo e-mail
-- Substitua o e-mail se necessário

INSERT INTO admin_roles (user_id, role, notes)
SELECT
  id,
  'super_admin',
  'Bootstrap inicial — Owner do produto'
FROM auth.users
WHERE email = 'sjoaopedro606@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET role  = 'super_admin',
      notes = 'Bootstrap — atualizado';

-- Confirma o resultado
SELECT
  ar.user_id,
  au.email,
  ar.role,
  ar.granted_at
FROM admin_roles ar
JOIN auth.users au ON au.id = ar.user_id;
