// Simple test script to verify candidates page functionality
console.log('Testing candidates page functionality...');

// Test 1: Check if MSW is available
if (typeof window !== 'undefined') {
  console.log('✅ Window object available');
  
  // Test 2: Check MSW readiness
  if (window.__MSW_READY__) {
    console.log('✅ MSW is ready');
  } else {
    console.log('⚠️  MSW not ready');
  }
  
  // Test 3: Check database error flag
  if (window.__DB_ERROR__) {
    console.log('⚠️  Database error detected');
  } else {
    console.log('✅ No database errors');
  }
  
  // Test 4: Test API endpoint
  fetch('/api/candidates?page=1&pageSize=10')
    .then(response => {
      console.log('✅ API endpoint accessible:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('✅ API response valid:', data);
    })
    .catch(error => {
      console.log('⚠️  API endpoint failed:', error.message);
    });
} else {
  console.log('❌ Window object not available (Node.js environment)');
}

console.log('Test completed.');
