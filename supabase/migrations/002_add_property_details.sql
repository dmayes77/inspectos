ALTER TABLE properties
  ADD COLUMN bedrooms INTEGER,
  ADD COLUMN bathrooms NUMERIC(4, 1),
  ADD COLUMN stories TEXT,
  ADD COLUMN foundation TEXT,
  ADD COLUMN garage TEXT,
  ADD COLUMN pool BOOLEAN;
