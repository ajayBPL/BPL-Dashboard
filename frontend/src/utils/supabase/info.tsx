/* 
 * ⚠️  SECURITY: These values should be set via environment variables
 * Use VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY in your .env file
 * DO NOT hardcode credentials in this file
 */

// Get from environment variables (fallback to placeholder for development)
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "your-project-id"
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your_supabase_anon_key_here"

// Validate that environment variables are set in production
if (isProduction && (projectId === "your-project-id" || publicAnonKey === "your_supabase_anon_key_here")) {
  console.error("⚠️  CRITICAL: VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY must be set in production!")
  console.error("   Create frontend/.env.production with:")
  console.error("   VITE_SUPABASE_PROJECT_ID=mwrdlemotjhrnjzncbxk")
  console.error("   VITE_SUPABASE_ANON_KEY=your_anon_key_here")
  console.error("   VITE_SUPABASE_URL=https://mwrdlemotjhrnjzncbxk.supabase.co")
}