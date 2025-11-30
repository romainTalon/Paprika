-- Migration: Convert MealSlot from single object to array of objects
-- This migration updates existing meal_plans.meals JSONB structure
-- From: { "monday-breakfast": { recipeId: "uuid", servings: 4, isCooked: false } }
-- To:   { "monday-breakfast": [{ recipeId: "uuid", servings: 4, isCooked: false }] }

-- ⚠️ IMPORTANT: Backup your data before running this migration!
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

BEGIN;

-- Update all existing meal plans
UPDATE meal_plans
SET meals = (
  SELECT jsonb_object_agg(
    key,
    jsonb_build_array(value) -- Wrap existing MealSlot object in array
  )
  FROM jsonb_each(meals)
  WHERE meals IS NOT NULL AND meals::text != '{}'::text
)
WHERE meals IS NOT NULL AND meals::text != '{}'::text;

-- Verify migration
-- SELECT
--   id,
--   week_start,
--   jsonb_typeof(meals -> 'monday-breakfast') as slot_type,
--   meals -> 'monday-breakfast' as monday_breakfast_data
-- FROM meal_plans
-- WHERE meals ? 'monday-breakfast'
-- LIMIT 5;

COMMIT;

-- Expected result after migration:
-- slot_type should be 'array' instead of 'object'
-- monday_breakfast_data should show: [{ recipeId: "...", servings: 4, isCooked: false }]
