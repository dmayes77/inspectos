-- Ensure seeded owner profile shows the intended display name
UPDATE profiles
SET full_name = 'David Mayes'
WHERE id = 'ccd639ca-8c80-437f-b5fb-f39ab126097d';
