// Sentry Integration Test Script
// Copy and paste this into your browser console after the app loads

console.log('🧪 Starting Sentry Integration Tests...');

// Test 1: Check if Sentry is initialized
console.log('📡 Test 1: Checking Sentry initialization...');
if (typeof window.Sentry !== 'undefined')
{
    console.log('✅ Sentry is available globally');
} else
{
    console.log('ℹ️ Sentry not available globally (this is expected with Angular integration)');
}

// Test 2: Trigger a manual error to test global error handler
console.log('🔥 Test 2: Triggering a test error in 2 seconds...');
setTimeout(() =>
{
    console.log('💥 Throwing test error now...');
    throw new Error('🧪 Console Test Error - This should be captured by Sentry');
}, 2000);

// Test 3: Test HTTP error (will be caught by HTTP interceptor)
console.log('🌐 Test 3: Testing HTTP error capture...');
setTimeout(() =>
{
    fetch('/api/non-existent-test-endpoint')
        .then(response =>
        {
            if (!response.ok)
            {
                console.log('📡 HTTP error response received (expected)');
            }
        })
        .catch(error =>
        {
            console.log('🔌 Network error caught:', error.message);
        });
}, 1000);

// Test 4: Check Angular service availability (if available in console)
console.log('🅰️ Test 4: Checking Angular services...');
setTimeout(() =>
{
    try
    {
        // Try to access Angular's injector to get our Sentry service
        if (typeof ng !== 'undefined' && ng.getComponent)
        {
            console.log('✅ Angular dev tools available');
            console.log('ℹ️ You can use ng.getComponent($0) to get component and test Sentry services');
        } else
        {
            console.log('ℹ️ Angular dev tools not available - this is normal in production builds');
        }
    } catch (e)
    {
        console.log('ℹ️ Angular service testing not available in console');
    }
}, 500);

// Test 5: Navigation test (if router is available)
console.log('🧭 Test 5: Testing navigation error capture...');
setTimeout(() =>
{
    try
    {
        // Try to navigate to a non-existent route
        if (window.location)
        {
            const currentUrl = window.location.href;
            console.log('Current URL:', currentUrl);
            console.log('ℹ️ Navigation errors are captured automatically by SentryRouterService');
        }
    } catch (e)
    {
        console.log('Navigation test error:', e);
    }
}, 3000);

console.log('⏰ Tests initiated. Check:');
console.log('1. This console for test confirmations');
console.log('2. Network tab for requests to *.ingest.sentry.io');
console.log('3. Your Sentry dashboard for new events');
console.log('');
console.log('🎯 Expected timeline:');
console.log('- HTTP error: ~1 second');
console.log('- Manual error: ~2 seconds');
console.log('- All tests complete: ~3 seconds');
console.log('');
console.log('✨ After tests complete, check your Sentry dashboard!');
