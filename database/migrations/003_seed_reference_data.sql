INSERT INTO roles (name, description) VALUES
  ('citizen','Citizen application user'),
  ('officer','Operational civic officer'),
  ('supervisor','Supervises civic operations'),
  ('administrator','Platform administrator'),
  ('public_viewer','Public information viewer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description) VALUES
  ('reports:read','Read citizen reports'),
  ('reports:write','Create and update reports'),
  ('incidents:read','Read civic incidents'),
  ('incidents:manage','Manage civic incidents'),
  ('users:manage','Manage platform users')
ON CONFLICT (name) DO NOTHING;

INSERT INTO severity_definitions (code, name, level, description) VALUES
  ('low','Low',1,'Limited local impact'),
  ('medium','Medium',2,'Moderate public impact'),
  ('high','High',3,'Significant public impact'),
  ('critical','Critical',4,'Immediate or widespread public impact')
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (name, code, description) VALUES
  ('Roads & Transport','ROADS','Roads, traffic and transport infrastructure'),
  ('Water & Sanitation','WATER','Water supply, drainage and sanitation'),
  ('Solid Waste','WASTE','Waste collection and disposal'),
  ('Public Lighting','LIGHTING','Street and public-area lighting')
ON CONFLICT (name) DO NOTHING;

INSERT INTO issue_categories (department_id, name, code, description)
SELECT d.id, v.name, v.code, v.description
FROM departments d
JOIN (VALUES
  ('ROADS','Pothole','POTHOLE','Road surface damage'),
  ('WATER','Water Leak','WATER_LEAK','Public water leakage'),
  ('WASTE','Overflowing Bin','BIN_OVERFLOW','Waste container overflow'),
  ('LIGHTING','Streetlight Out','STREETLIGHT_OUT','Non-functioning public light')
) AS v(dept_code,name,code,description) ON v.dept_code = d.code
ON CONFLICT (code) DO NOTHING;

INSERT INTO issue_subcategories (category_id, name, code, description)
SELECT c.id, 'General', 'GENERAL', 'Default subcategory'
FROM issue_categories c
ON CONFLICT (category_id, code) DO NOTHING;
