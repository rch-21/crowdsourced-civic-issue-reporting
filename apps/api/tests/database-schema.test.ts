import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), '../../database/migrations/002_civic_domain.sql'),
  'utf8'
);

const seed = readFileSync(
  resolve(process.cwd(), '../../database/migrations/003_seed_reference_data.sql'),
  'utf8'
);

describe('civic database foundation', () => {
  it('defines reports and incidents with the clustering relationship', () => {
    expect(migration).toContain('CREATE TABLE reports');
    expect(migration).toContain('CREATE TABLE incidents');
    expect(migration).toContain('ALTER TABLE reports ADD CONSTRAINT reports_incident_fk');
    expect(migration).toContain('REFERENCES incidents(id) ON DELETE SET NULL');
  });

  it('uses PostGIS geometry and geographic indexes', () => {
    expect(migration).toContain('geometry(Point, 4326)');
    expect(migration).toContain('geometry(MultiPolygon, 4326)');
    expect(migration).toContain('idx_reports_location_gist');
    expect(migration).toContain('idx_incidents_location_gist');
    expect(migration).toContain('USING gist(location)');
  });

  it('includes reference seed data without AI-derived fields', () => {
    expect(seed).toContain("('citizen','Citizen application user')");
    expect(seed).toContain("('critical','Critical',4");
    expect(migration).not.toContain('cluster_score');
    expect(migration).not.toContain('ai_score');
  });
});
