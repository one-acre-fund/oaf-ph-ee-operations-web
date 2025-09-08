// Sentry HTTP Error Diagnostic Script
// Copy and paste this into your browser console to diagnose HTTP error reporting

console.log('🔍 Starting Sentry HTTP Error Diagnostics...');

// Check if Sentry is properly initialized
console.log('1. Checking Sentry initialization...');
if (typeof Sentry !== 'undefined')
{
  console.log('✅ Sentry is available globally');

  // Get current hub and client
  const hub = Sentry.getCurrentHub();
  const client = hub.getClient();

  if (client)
  {
    console.log('✅ Sentry client is active');
    console.log('📊 Current options:', client.getOptions());
  } else
  {
    console.log('❌ No Sentry client found');
  }
} else
{
  console.log('❌ Sentry not available globally');
  console.log('ℹ️  This might be normal with Angular integration');
}

// Test HTTP error capture manually
console.log('\n2. Testing HTTP error capture...');

// Create a mock HttpErrorResponse to test the service
const testHttpError = {
  name: 'HttpErrorResponse',
  message: 'Http failure response for /test/404: 404 Not Found',
  status: 404,
  statusText: 'Not Found',
  url: '/test/404',
  error: { message: 'Not Found' }
};

// Try to capture it directly
console.log('🧪 Attempting to capture HTTP error manually...');
try
{
  if (typeof Sentry !== 'undefined')
  {
    Sentry.captureException(testHttpError);
    console.log('✅ Manual HTTP error capture sent');
  }
} catch (e)
{
  console.log('❌ Failed to capture HTTP error:', e);
}

// Test actual HTTP requests
console.log('\n3. Testing actual HTTP requests...');

const testUrls = [
  '/api/nonexistent-endpoint-404',
  'https://httpstat.us/500',
  'https://httpstat.us/404',
  'https://httpstat.us/403'
];

testUrls.forEach((url, index) =>
{
  setTimeout(() =>
  {
    console.log(`🌐 Testing request to: ${url}`);

    fetch(url, { mode: 'cors' })
      .then(response =>
      {
        console.log(`📡 Response ${response.status} for ${url}`);
        if (!response.ok)
        {
          console.log(`⚠️  Non-OK response: ${response.status} ${response.statusText}`);
        }
      })
      .catch(error =>
      {
        console.log(`🔥 Network error for ${url}:`, error);

        // Manually capture this error to test
        if (typeof Sentry !== 'undefined')
        {
          Sentry.withScope(scope =>
          {
            scope.setTag('test.type', 'manual-http-error');
            scope.setContext('http_request', { url, method: 'GET' });
            Sentry.captureException(error);
          });
        }
      });
  }, index * 1000);
});

// Check browser network requests
console.log('\n4. Monitoring network requests...');
console.log('💡 To verify HTTP interceptor:');
console.log('   1. Open DevTools → Network tab');
console.log('   2. Look for requests with 4xx/5xx status codes');
console.log('   3. Check if corresponding events appear in Sentry');

// Check for Angular HTTP interceptors
console.log('\n5. Checking Angular HTTP setup...');
try
{
  // Try to get Angular's injector to check HTTP interceptors
  if (typeof ng !== 'undefined')
  {
    console.log('✅ Angular dev tools available');
    console.log('💡 You can inspect components with ng.getComponent($0)');
  } else
  {
    console.log('ℹ️  Angular dev tools not available');
  }
} catch (e)
{
  console.log('ℹ️  Could not access Angular internals');
}

// Instructions for manual verification
console.log('\n📋 Manual Verification Steps:');
console.log('1. Check Network tab for 4xx/5xx responses');
console.log('2. Look for Sentry requests to *.ingest.sentry.io');
console.log('3. Verify HTTP errors appear in Sentry Issues (not just Performance)');
console.log('4. Check if errors are being filtered out by beforeSend');

// Set up monitoring for Sentry events
console.log('\n6. Setting up Sentry event monitoring...');
if (typeof Sentry !== 'undefined')
{
  const originalCaptureException = Sentry.captureException;

  Sentry.captureException = function (exception, ...args)
  {
    console.log('📤 Sentry.captureException called with:', exception);
    return originalCaptureException.call(this, exception, ...args);
  };

  console.log('✅ Sentry event monitoring enabled');
  console.log('   All calls to Sentry.captureException will be logged');
}

console.log('\n🎯 Next Steps:');
console.log('1. Watch this console for test results');
console.log('2. Check Sentry dashboard for new events');
console.log('3. If still no HTTP errors, check the diagnostic results above');
console.log('\nDiagnostics complete! 🏁');
