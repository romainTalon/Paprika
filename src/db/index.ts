/**
 * Drizzle Database Client for Supabase
 * Configured with connection pooling via postgres.js
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Check for database URL
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined. Please set it in your .env.local file.\n" +
    "Format: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres"
  );
}

// Create postgres connection
// For serverless environments, use connection pooling
const queryClient = postgres(DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema and types
export { schema };
export * from "./schema";
