const axios = require('axios');

const API_URL = 'http://localhost:8000/api/v1';

const timestamp = Date.now();
const testEmail = `testuser${timestamp}@example.com`;
const testData = {
  organization_name: `Test Organization ${timestamp}`, // Make organization name unique
  website: 'https://testorg.com',
  phone_number: '1234567890',
  first_name: 'Test',
  last_name: 'User',
  email: testEmail,
  username: testEmail.split('@')[0], // Generate username from email
  password: 'testpassword123',
  confirm_password: 'testpassword123',
  plan_duration_id: 1
};

async function testRegistration() {
  try {
    console.log('Testing organization registration endpoint...');
    console.log('Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${API_URL}/org/register/`, testData, {
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRegistration();
