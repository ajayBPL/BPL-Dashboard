// Debug Database Schema Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database schema...');

    // Get all users with all columns
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 Users in database:');
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Role:', user.role);
      console.log('  Employee ID:', user.employeeId);
      console.log('  Password (first 20 chars):', user.password ? user.password.substring(0, 20) + '...' : 'null');
      console.log('  Is Active:', user.isActive);
      console.log('  Created At:', user.createdAt);
    });

    // Test the exact query the auth route uses
    console.log('\n🔍 Testing findUserByEmail query...');
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@bplcommander.com')
      .single();
    
    if (emailError) {
      console.error('❌ Email query error:', emailError);
    } else {
      console.log('✅ Email query successful:', {
        id: userByEmail.id,
        email: userByEmail.email,
        name: userByEmail.name,
        role: userByEmail.role,
        isActive: userByEmail.isActive,
        passwordExists: !!userByEmail.password
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDatabase();
