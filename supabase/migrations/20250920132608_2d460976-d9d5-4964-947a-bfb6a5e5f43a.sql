-- Assign permissions to Super Administrator (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions
ON CONFLICT DO NOTHING;

-- Assign permissions to Administrator (most permissions except system admin)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM permissions
WHERE name NOT IN ('system.admin', 'roles.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Staff Member
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM permissions
WHERE category IN ('applications', 'communication', 'content', 'users') 
   OR name IN ('analytics.view', 'staff.view', 'roles.assign')
ON CONFLICT DO NOTHING;

-- Assign permissions to Moderator
INSERT INTO role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM permissions
WHERE category IN ('moderation') 
   OR name IN ('applications.view', 'chat.manage', 'users.view', 'users.edit')
ON CONFLICT DO NOTHING;

-- Assign permissions to Projekt Leder (Project Leader - highest custom role)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '998b6f03-a5d8-4d60-be94-b75b99c64b39', id FROM permissions
WHERE category IN ('applications', 'communication', 'content', 'design', 'staff_management', 'analytics')
   OR name IN ('roles.assign', 'users.view', 'users.edit')
ON CONFLICT DO NOTHING;

-- Assign permissions to Projekt Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11a3e7c4-340c-464f-9bc0-89f14cc6eb78', id FROM permissions
WHERE category IN ('applications', 'communication', 'content', 'staff_management')
   OR name IN ('analytics.view', 'users.view', 'users.edit')
ON CONFLICT DO NOTHING;

-- Assign permissions to Community Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd25a9bf4-b3a1-4eba-aa19-858ff41f4e47', id FROM permissions
WHERE category IN ('communication', 'content', 'moderation')
   OR name IN ('applications.view', 'users.view', 'social.manage', 'discord.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Head Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT '23cbc081-0337-4062-a0a9-6bb68afe4f0b', id FROM permissions
WHERE category IN ('applications', 'communication', 'content', 'moderation', 'users')
   OR name IN ('analytics.view', 'staff.view', 'roles.assign')
ON CONFLICT DO NOTHING;

-- Assign permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT '9a4f36ad-d08c-4144-80d0-dc33bc7f4cfb', id FROM permissions
WHERE category IN ('applications', 'communication', 'moderation', 'users')
   OR name IN ('analytics.view', 'content.manage', 'rules.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Head Udvikler (Head Developer)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '8e4602b9-a4dc-4b48-a71d-af69b27b8686', id FROM permissions
WHERE category IN ('system', 'design', 'analytics')
   OR name IN ('applications.view', 'users.view', 'content.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Hjemmeside udvikler (Website Developer)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '24c777b3-9a21-4322-af56-dea31409dde9', id FROM permissions
WHERE category IN ('design', 'content')
   OR name IN ('analytics.view', 'homepage.manage', 'navbar.manage', 'social.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Hjælpe udvikler (Helper Developer)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '9db907e5-0683-4b89-bfe3-ca8fcd7bd79a', id FROM permissions
WHERE category IN ('design')
   OR name IN ('content.manage', 'analytics.view')
ON CONFLICT DO NOTHING;

-- Assign permissions to Designer
INSERT INTO role_permissions (role_id, permission_id)
SELECT '476e95ea-3df4-4acc-9408-e80d94c513c5', id FROM permissions
WHERE category IN ('design')
   OR name IN ('homepage.manage', 'navbar.manage', 'social.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Supporter
INSERT INTO role_permissions (role_id, permission_id)
SELECT '8fa257b6-cde2-4462-a5ac-ca9408e17e90', id FROM permissions
WHERE name IN ('applications.view', 'users.view', 'chat.manage', 'moderation.basic')
ON CONFLICT DO NOTHING;

-- Assign permissions to Prøve Supporter (Trial Supporter)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '36ebb8d1-983c-41fa-be5d-36a8e343f4f7', id FROM permissions
WHERE name IN ('applications.view', 'chat.manage')
ON CONFLICT DO NOTHING;

-- Assign permissions to Allowlist modtager (Allowlist Receiver)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd1b72be6-374b-4218-9622-fbd60bae6194', id FROM permissions
WHERE name IN ('applications.view', 'users.view')
ON CONFLICT DO NOTHING;