// Comprehensive Sentry HTTP Error Test
// This script will test HTTP error reporting and help identify issues

console.log('🔧 SENTRY HTTP ERROR DIAGNOSTIC TEST');
console.log('=====================================');

// Step 1: Test direct Sentry functionality
console.log('\n1️⃣ Testing Direct Sentry Functionality...');

function testDirectSentry()
{
  // Test if we can capture a simple message
  setTimeout(() =>
  {
    console.log('📨 Testing direct message capture...');
    throw new Error('🧪 Direct test error - should appear in Sentry');
  }, 1000);
}

// Step 2: Test HTTP requests that should trigger the interceptor
console.log('\n2️⃣ Testing HTTP Error Capture...');

function testHttpErrors()
{
  const testCases = [
    { url: '/api/404-test', expectedStatus: 404, description: '404 Not Found' },
    { url: '/api/500-test', expectedStatus: 500, description: '500 Server Error' },
    { url: '/non-existent-endpoint', expectedStatus: 404, description: 'Non-existent endpoint' }
  ];

  testCases.forEach((testCase, index) =>
  {
    setTimeout(() =>
    {
      console.log(`🌐 Testing ${testCase.description}...`);

      // Using fetch (might not be intercepted by Angular HTTP interceptor)
      fetch(testCase.url)
        .then(response =>
        {
          console.log(`📡 Fetch response: ${response.status} for ${testCase.url}`);
        })
        .catch(error =>
        {
          console.log(`🔥 Fetch error: ${error.message} for ${testCase.url}`);
        });

      // Try to access Angular's HttpClient if available
      try
      {
        // This won't work from console, but shows the concept
        console.log(`💡 For proper testing, use Angular HttpClient in component`);
      } catch (e)
      {
        console.log(`ℹ️ Cannot access Angular HttpClient from console`);
      }
    }, (index + 2) * 1000);
  });
}

// Step 3: Monitor network activity
console.log('\n3️⃣ Network Monitoring Guide...');
console.log('📊 To verify HTTP interceptor is working:');
console.log('   1. Open DevTools → Network tab');
console.log('   2. Clear network log');
console.log('   3. Trigger HTTP errors in your app');
console.log('   4. Look for:');
console.log('      - Red status codes (4xx, 5xx)');
console.log('      - Requests to *.ingest.sentry.io');

// Step 4: Sentry configuration check
console.log('\n4️⃣ Sentry Configuration Check...');
console.log('🔍 Manual checks needed:');
console.log('   ✓ Sentry DSN configured');
console.log('   ✓ Sentry enabled in environment');
console.log('   ✓ HTTP interceptor registered');
console.log('   ✓ Check Sentry dashboard: Issues tab (not Performance)');

// Step 5: Component-based testing
console.log('\n5️⃣ Component Testing Required...');
console.log('⚠️ IMPORTANT: fetch() requests do NOT go through Angular HTTP interceptor!');
console.log('   📝 To properly test HTTP interceptor, you need to:');
console.log('   1. Use Angular HttpClient in a component');
console.log('   2. Add the test component to your app');
console.log('   3. Make HTTP requests using HttpClient');

// Code example for proper testing
console.log('\n📋 COMPONENT TEST CODE:');
console.log(`
// Add this to any component to test HTTP interceptor:
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

testHttpErrors() {
  // This WILL trigger the HTTP interceptor
  this.http.get('/api/404-test').subscribe({
    next: (data) => console.log('Success:', data),
    error: (error) => console.log('HTTP Error caught:', error)
  });
  
  this.http.get('/api/500-test').subscribe({
    next: (data) => console.log('Success:', data),
    error: (error) => console.log('HTTP Error caught:', error)
  });
}
`);

// Run the tests
console.log('\n🚀 Starting tests...');
testDirectSentry();
testHttpErrors();

// Final instructions
console.log('\n📝 NEXT STEPS:');
console.log('1. Watch browser console for error messages');
console.log('2. Check Network tab for Sentry requests');
console.log('3. Wait 2-3 minutes, then check Sentry dashboard');
console.log('4. If still no HTTP errors, add component test code above');
console.log('5. Remember: Only Angular HttpClient errors are intercepted!');

console.log('\n⭐ PRO TIP:');
console.log('Add the SentryDemoComponent to your app for comprehensive testing!');
console.log('It uses Angular HttpClient and will properly trigger the interceptor.');

console.log('\n🎯 Expected Results:');
console.log('- Console: Error messages and confirmations');
console.log('- Network: Requests to *.ingest.sentry.io (status 200)');
console.log('- Sentry: New issues in your dashboard (Issues tab)');
console.log('- Timing: Events appear in Sentry within 1-3 minutes');

console.log('\nTest initiated! 🏁');
