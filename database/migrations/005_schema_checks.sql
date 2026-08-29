-- Migration-time integrity checks. These run only when the database is initialized.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reports_location_gist') THEN
    RAISE EXCEPTION 'Missing reports geographic index';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_incidents_location_gist') THEN
    RAISE EXCEPTION 'Missing incidents geographic index';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    RAISE EXCEPTION 'Reports table was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
    RAISE EXCEPTION 'Incidents table was not created';
  END IF;
END $$;
