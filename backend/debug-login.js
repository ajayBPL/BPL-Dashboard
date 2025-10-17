// Debug Login Issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugLogin() {
  try {
    console.log('🔍 Debugging login issue...');
    
    // Test the exact query the auth route uses
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@bplcommander.com')
      .single();
    
    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }
    
    console.log('📊 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isactive, // Note: lowercase
      passwordExists: !!user.password,
      passwordStart: user.password ? user.password.substring(0, 20) + '...' : 'null'
    });
    
    // Test password verification
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare('Admin123!', user.password);
    console.log('🔐 Password verification:', isPasswordValid);
    
    // Check if user is active
    console.log('✅ User is active:', user.isactive);
    
    if (!user.isactive) {
      console.log('❌ User is inactive - this is the issue!');
    } else if (!isPasswordValid) {
      console.log('❌ Password is invalid - this is the issue!');
    } else {
      console.log('✅ User data looks correct - issue might be elsewhere');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLogin();
