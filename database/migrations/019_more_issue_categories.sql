INSERT INTO issue_categories (department_id, name, code, description)
SELECT d.id, v.name, v.code, v.description
FROM departments d
JOIN (VALUES
  ('ROADS','Damaged Road Sign','ROAD_SIGN_DAMAGE','Missing or damaged road sign'),
  ('ROADS','Traffic Signal Problem','TRAFFIC_SIGNAL','Traffic signal or crossing light problem'),
  ('ROADS','Footpath Damage','FOOTPATH_DAMAGE','Damaged or blocked footpath'),
  ('WATER','Blocked Drain','BLOCKED_DRAIN','Blocked storm-water or roadside drain'),
  ('WATER','Sewage Problem','SEWAGE_PROBLEM','Sewage overflow or sewer issue'),
  ('WASTE','Illegal Dumping','ILLEGAL_DUMPING','Waste dumped in a public place'),
  ('WASTE','Litter or Debris','LITTER_DEBRIS','Litter or debris requiring collection'),
  ('LIGHTING','Public Area Lighting','PUBLIC_AREA_LIGHTING','Lighting problem in a public area')
) AS v(dept_code,name,code,description) ON v.dept_code = d.code
ON CONFLICT (code) DO NOTHING;

INSERT INTO issue_categories (department_id, name, code, description)
VALUES (NULL, 'Other problem', 'OTHER_PROBLEM', 'Describe a problem and the system will route it using transparent keyword rules')
ON CONFLICT (code) DO NOTHING;
