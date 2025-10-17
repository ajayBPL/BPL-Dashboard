// Check Actual Column Names
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  try {
    console.log('🔍 Checking actual column names...');
    
    // Get one user to see the actual column names
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('📊 Actual column names:');
    Object.keys(user).forEach(key => {
      console.log(`  ${key}: ${typeof user[key]} = ${user[key]}`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkColumns();
