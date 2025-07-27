// Simple test script to debug the swap API
const fetch = require('node-fetch');

async function testSwap() {
  try {
    console.log('Testing swap API...');
    
    // First, let's check if we can reach the API
    const response = await fetch('http://localhost:3003/api/schedule/swap-days', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromDay: 1, // Monday
        toDay: 0,   // Sunday
        userId: 'test-user-id'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSwap();
