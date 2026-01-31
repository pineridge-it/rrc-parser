-- ============================================================================
-- WATCHLIST ITEMS TABLE MIGRATION
-- ============================================================================

\echo 'Creating watchlist items table...'

-- Include the watchlist items table definition
\i ../schema/watchlist_items.sql

-- Verify the table was created
SELECT 'watchlist_items table created successfully' as message;

-- Show table structure
\d watchlist_items

\echo 'Watchlist items table migration completed'