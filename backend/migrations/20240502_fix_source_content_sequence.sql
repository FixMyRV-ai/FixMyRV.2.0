-- Fix the sequence for source-contents table
SELECT setval(pg_get_serial_sequence('source-contents', 'id'), COALESCE((SELECT MAX(id) FROM "source-contents"), 0) + 1, false); 