// Database Connection Test Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing Supabase database connection...');

    // Test 1: Check if users table exists
    console.log('1️⃣ Checking if users table exists...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      return;
    }
    
    console.log('✅ Users table exists');
    console.log('📊 Current users:', users);

    // Test 2: Check if projects table exists
    console.log('\n2️⃣ Checking if projects table exists...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, status')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Projects table error:', projectsError.message);
      return;
    }
    
    console.log('✅ Projects table exists');
    console.log('📊 Current projects:', projects);

    // Test 3: Check if initiatives table exists
    console.log('\n3️⃣ Checking if initiatives table exists...');
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('id, title, status')
      .limit(1);
    
    if (initiativesError) {
      console.error('❌ Initiatives table error:', initiativesError.message);
      return;
    }
    
    console.log('✅ Initiatives table exists');
    console.log('📊 Current initiatives:', initiatives);

    console.log('\n✅ Database connection test completed successfully!');
    console.log('📝 If no data is shown above, run the insert-default-data.sql script in Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

testDatabaseConnection();
