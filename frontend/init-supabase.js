// Initialize Supabase System
// This script initializes the Supabase system with default users

import { supabaseService } from './src/services/supabaseService'

async function initializeSupabase() {
  console.log('🚀 Initializing Supabase system...')
  
  try {
    // Initialize the system
    const initResult = await supabaseService.initializeSystem()
    
    if (initResult.success) {
      console.log('✅ Supabase system initialized successfully!')
      console.log('📋 Default users created:')
      console.log('   - admin@bplcommander.com (password: admin123)')
      console.log('   - manager@bplcommander.com (password: manager123)')
      console.log('   - employee@bplcommander.com (password: employee123)')
    } else {
      console.error('❌ Failed to initialize Supabase system:', initResult.error)
    }
  } catch (error) {
    console.error('❌ Error initializing Supabase system:', error)
  }
}

// Run the initialization
initializeSupabase()
