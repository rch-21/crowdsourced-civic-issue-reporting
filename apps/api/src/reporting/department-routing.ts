const RULES: Array<{ department: string; terms: string[] }> = [
  { department: 'ROADS', terms: ['pothole', 'road', 'traffic', 'signal', 'signboard', 'signage', 'footpath', 'sidewalk', 'bridge', 'street'] },
  { department: 'WATER', terms: ['water', 'leak', 'pipe', 'drain', 'drainage', 'sewage', 'sewer', 'flood', 'flooding', 'septic'] },
  { department: 'WASTE', terms: ['garbage', 'waste', 'trash', 'dump', 'dumping', 'bin', 'litter', 'debris', 'recycling'] },
  { department: 'LIGHTING', terms: ['light', 'lighting', 'lamp', 'streetlight', 'dark', 'electricity', 'electrical'] }
];

export function detectDepartmentCode(description: string): string | null {
  const text = description.toLowerCase();
  const match = RULES.find((rule) => rule.terms.some((term) => text.includes(term)));
  return match?.department ?? null;
}
