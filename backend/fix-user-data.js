// Fix User Data Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixUsers() {
  try {
    console.log('🔧 Fixing user data...');
    
    // Update isActive for all users
    const { error: activeError } = await supabase
      .from('users')
      .update({ isActive: true })
      .is('isActive', null);
    
    if (activeError) {
      console.error('❌ Error updating isActive:', activeError);
    } else {
      console.log('✅ Updated isActive for all users');
    }
    
    // Update employeeId for admin
    const { error: adminError } = await supabase
      .from('users')
      .update({ employeeId: 'ADMIN001' })
      .eq('email', 'admin@bplcommander.com');
    
    if (adminError) {
      console.error('❌ Error updating admin employeeId:', adminError);
    } else {
      console.log('✅ Updated admin employeeId');
    }
    
    // Update employeeId for manager
    const { error: managerError } = await supabase
      .from('users')
      .update({ employeeId: 'MGR001' })
      .eq('email', 'manager@bplcommander.com');
    
    if (managerError) {
      console.error('❌ Error updating manager employeeId:', managerError);
    } else {
      console.log('✅ Updated manager employeeId');
    }
    
    // Update employeeId for employee
    const { error: employeeError } = await supabase
      .from('users')
      .update({ employeeId: 'EMP001' })
      .eq('email', 'employee@bplcommander.com');
    
    if (employeeError) {
      console.error('❌ Error updating employee employeeId:', employeeError);
    } else {
      console.log('✅ Updated employee employeeId');
    }
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const { data: users, error: verifyError } = await supabase
      .from('users')
      .select('id, email, name, role, employeeId, isActive');
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log('📊 Updated users:');
      users.forEach(user => {
        console.log(`  ${user.email}: ${user.role} (${user.employeeId}) - Active: ${user.isActive}`);
      });
    }
    
    console.log('\n✅ User data fixed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixUsers();
