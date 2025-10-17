// API Test Script for BPL Commander
// Run this to test all API endpoints

const API_BASE_URL = 'http://localhost:3001/api';
const HEALTH_URL = 'http://localhost:3001/health';

async function testAPI() {
  console.log('🧪 Testing BPL Commander API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(HEALTH_URL);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Login
    console.log('2️⃣ Testing Login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bplcommander.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);
    
    if (loginData.success && loginData.data.token) {
      const token = loginData.data.token;
      console.log('✅ Login successful!');
      console.log('');

      // Test 3: Get Users (requires authentication)
      console.log('3️⃣ Testing Get Users...');
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const usersData = await usersResponse.json();
      console.log('Users Response:', usersData);
      console.log('');

      // Test 4: Get Projects
      console.log('4️⃣ Testing Get Projects...');
      const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const projectsData = await projectsResponse.json();
      console.log('Projects Response:', projectsData);
      console.log('');

      // Test 5: Get Initiatives
      console.log('5️⃣ Testing Get Initiatives...');
      const initiativesResponse = await fetch(`${API_BASE_URL}/initiatives`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const initiativesData = await initiativesResponse.json();
      console.log('Initiatives Response:', initiativesData);
      console.log('');

    } else {
      console.log('❌ Login failed:', loginData.error);
      console.log('');
      console.log('🔧 Please ensure:');
      console.log('   1. Database schema is created in Supabase');
      console.log('   2. Default users are inserted');
      console.log('   3. Backend is running on port 3001');
    }

  } catch (error) {
    console.error('❌ API Test Error:', error);
    console.log('');
    console.log('🔧 Please ensure:');
    console.log('   1. Backend server is running: npm run dev (in backend folder)');
    console.log('   2. Database schema is created in Supabase');
    console.log('   3. Network connectivity is working');
  }
}

// Run the test
testAPI();
