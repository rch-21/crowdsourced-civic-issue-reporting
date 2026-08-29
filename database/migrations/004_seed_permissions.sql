INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE (r.name = 'citizen' AND p.name IN ('reports:read','reports:write'))
   OR (r.name = 'officer' AND p.name IN ('reports:read','reports:write','incidents:read','incidents:manage'))
   OR (r.name = 'supervisor' AND p.name IN ('reports:read','reports:write','incidents:read','incidents:manage'))
   OR (r.name = 'administrator' AND p.name IN ('reports:read','reports:write','incidents:read','incidents:manage','users:manage'))
ON CONFLICT DO NOTHING;
