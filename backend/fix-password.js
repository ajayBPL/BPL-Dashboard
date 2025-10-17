// Fix Password Hash
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixPassword() {
  try {
    console.log('🔧 Fixing password hash...');
    
    // Generate new password hash
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
    console.log('🔐 New password hash:', newPasswordHash.substring(0, 30) + '...');
    
    // Update password for admin user
    const { error: adminError } = await supabase
      .from('users')
      .update({ password: newPasswordHash })
      .eq('email', 'admin@bplcommander.com');
    
    if (adminError) {
      console.error('❌ Error updating admin password:', adminError);
    } else {
      console.log('✅ Updated admin password');
    }
    
    // Update password for manager user
    const { error: managerError } = await supabase
      .from('users')
      .update({ password: newPasswordHash })
      .eq('email', 'manager@bplcommander.com');
    
    if (managerError) {
      console.error('❌ Error updating manager password:', managerError);
    } else {
      console.log('✅ Updated manager password');
    }
    
    // Update password for employee user
    const { error: employeeError } = await supabase
      .from('users')
      .update({ password: newPasswordHash })
      .eq('email', 'employee@bplcommander.com');
    
    if (employeeError) {
      console.error('❌ Error updating employee password:', managerError);
    } else {
      console.log('✅ Updated employee password');
    }
    
    // Test the new password
    console.log('\n🧪 Testing new password...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@bplcommander.com')
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError);
    } else {
      const isPasswordValid = await bcrypt.compare('Admin123!', user.password);
      console.log('🔐 Password verification test:', isPasswordValid);
      
      if (isPasswordValid) {
        console.log('✅ Password fix successful!');
      } else {
        console.log('❌ Password fix failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixPassword();
